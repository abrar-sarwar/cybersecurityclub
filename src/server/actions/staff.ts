"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { branding } from "@config/branding";
import { formatEventRange } from "@/lib/dates";
import {
  awardChallengeSchema,
  eventSchema,
  fieldErrors,
  memberRoleSchema,
  membershipStatusSchema,
  uuidSchema,
} from "@/lib/portal-schemas";
import { isEventUpcoming } from "@/lib/portal";
import { absoluteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { renderEmail, sendEmailBatch, type EmailMessage } from "@/server/email";
import { hitRateLimit, LIMITS } from "@/server/rate-limit";
import { staffForAction } from "@/server/session";
import { unsubscribeHeaders, unsubscribeLinks } from "@/server/unsubscribe";
import type { FormState } from "@/server/actions/member";

/** Every staff action re-checks the role on the server; hidden buttons are not security. */
async function requireStaffAction(min: "officer" | "admin") {
  const viewer = await staffForAction(min);
  if (!viewer) redirect("/dashboard");
  return viewer;
}

function adminPath(value: FormDataEntryValue | null, fallback: string) {
  return typeof value === "string" && /^\/admin(\/[\w\-/]*)?(\?[\w=&%\-.]*)?$/.test(value) ? value : fallback;
}

function withParam(path: string, key: string, value: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;
}

function eventInput(formData: FormData) {
  return {
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    location: formData.get("location") ?? "",
    starts_at: formData.get("starts_at") ?? "",
    ends_at: formData.get("ends_at") || undefined,
  };
}

export async function createEvent(_previous: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireStaffAction("officer");
  const input = eventInput(formData);
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values: input };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      ...parsed.data,
      starts_at: parsed.data.starts_at.toISOString(),
      ends_at: parsed.data.ends_at?.toISOString() ?? null,
      created_by: viewer.id,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[staff] create event failed", error);
    return { status: "error", message: "The event could not be saved.", values: input };
  }
  revalidatePath("/admin/events");
  redirect(`/admin/events/${data.id}?notice=created`);
}

export async function updateEvent(eventId: string, _previous: FormState, formData: FormData): Promise<FormState> {
  await requireStaffAction("officer");
  const id = uuidSchema.safeParse(eventId);
  const input = eventInput(formData);
  const parsed = eventSchema.safeParse(input);
  if (!id.success) return { status: "error", message: "Unknown event." };
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values: input };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      ...parsed.data,
      starts_at: parsed.data.starts_at.toISOString(),
      ends_at: parsed.data.ends_at?.toISOString() ?? null,
    })
    .eq("id", id.data)
    .select("id");
  if (error || !data.length) {
    console.error("[staff] update event failed", error ?? "no rows updated");
    return { status: "error", message: "The event could not be saved. It may have been deleted.", values: input };
  }
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${id.data}`);
  revalidatePath("/dashboard");
  return { status: "success", message: "Event saved." };
}

export async function deleteEvent(formData: FormData) {
  const viewer = await requireStaffAction("admin");
  const id = uuidSchema.safeParse(formData.get("event_id"));
  if (!id.success) redirect("/admin/events");
  if (!(await hitRateLimit(LIMITS.staffSensitivePerActor, viewer.id))) {
    redirect(`/admin/events/${id.data}?error=rate_limited`);
  }

  // A database trigger writes the audit entry in the same transaction.
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").delete().eq("id", id.data).select("id");
  if (error || !data?.length) {
    console.error("[staff] delete event failed", error);
    redirect(`/admin/events/${id.data}?error=delete_failed`);
  }
  revalidatePath("/admin/events");
  revalidatePath("/dashboard");
  redirect("/admin/events?notice=deleted");
}

export async function checkInMember(formData: FormData) {
  await requireStaffAction("officer");
  const eventId = uuidSchema.safeParse(formData.get("event_id"));
  const userId = uuidSchema.safeParse(formData.get("user_id"));
  const back = adminPath(formData.get("return_to"), "/admin/events");
  if (!eventId.success || !userId.success) redirect(withParam(back, "error", "check_in_failed"));

  const supabase = await createClient();
  const { error } = await supabase.rpc("check_in_member", { p_event_id: eventId.data, p_user_id: userId.data });
  if (error) {
    console.error("[staff] check-in failed", error);
    redirect(withParam(back, "error", "check_in_failed"));
  }
  revalidatePath(`/admin/events/${eventId.data}`);
  redirect(withParam(back, "notice", "checked_in"));
}

export async function undoCheckIn(formData: FormData) {
  await requireStaffAction("officer");
  const eventId = uuidSchema.safeParse(formData.get("event_id"));
  const userId = uuidSchema.safeParse(formData.get("user_id"));
  const back = adminPath(formData.get("return_to"), "/admin/events");
  if (!eventId.success || !userId.success) redirect(withParam(back, "error", "check_in_failed"));

  const supabase = await createClient();
  const { error } = await supabase.rpc("undo_check_in", { p_event_id: eventId.data, p_user_id: userId.data });
  if (error) {
    console.error("[staff] undo check-in failed", error);
    redirect(withParam(back, "error", "check_in_failed"));
  }
  revalidatePath(`/admin/events/${eventId.data}`);
  redirect(withParam(back, "notice", "check_in_removed"));
}

export async function awardChallenge(memberId: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const viewer = await requireStaffAction("officer");
  const id = uuidSchema.safeParse(memberId);
  const input = { reference_id: formData.get("reference_id") ?? "" };
  const parsed = awardChallengeSchema.safeParse(input);
  if (!id.success) return { status: "error", message: "Unknown member." };
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values: input };

  const supabase = await createClient();
  const { error } = await supabase.from("activity").insert({
    user_id: id.data,
    type: "challenge_completed",
    reference_id: parsed.data.reference_id,
    awarded_by: viewer.id,
  });
  if (error?.code === "23505") return { status: "error", message: "This challenge is already recorded for the member.", values: input };
  if (error) {
    console.error("[staff] award failed", error);
    return { status: "error", message: "The activity could not be recorded.", values: input };
  }
  revalidatePath(`/admin/members/${id.data}`);
  return { status: "success", message: "Challenge recorded." };
}

export async function changeMemberRole(formData: FormData) {
  const viewer = await requireStaffAction("admin");
  const userId = uuidSchema.safeParse(formData.get("user_id"));
  const role = memberRoleSchema.safeParse(formData.get("role"));
  if (!userId.success || !role.success) redirect("/admin/members");
  if (!(await hitRateLimit(LIMITS.staffSensitivePerActor, viewer.id))) {
    redirect(`/admin/members/${userId.data}?error=rate_limited`);
  }

  // Runs as the admin's own session, so the database checks the admin role
  // again and the audit trigger records who made the change.
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_role", { target_user_id: userId.data, new_role: role.data });
  if (error) {
    console.error("[staff] role change failed", error);
    redirect(`/admin/members/${userId.data}?error=role_failed`);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/members/${userId.data}?notice=role_updated`);
}

export async function changeMembershipStatus(formData: FormData) {
  const viewer = await requireStaffAction("admin");
  const userId = uuidSchema.safeParse(formData.get("user_id"));
  const status = membershipStatusSchema.safeParse(formData.get("status"));
  if (!userId.success || !status.success) redirect("/admin/members");
  if (!(await hitRateLimit(LIMITS.staffSensitivePerActor, viewer.id))) {
    redirect(`/admin/members/${userId.data}?error=rate_limited`);
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_membership_status", { target_user_id: userId.data, new_status: status.data });
  if (error) {
    console.error("[staff] membership change failed", error);
    redirect(`/admin/members/${userId.data}?error=status_failed`);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/members/${userId.data}?notice=status_updated`);
}

const RECIPIENT_PAGE = 1000;

/**
 * Emails opted-in, verified members about an upcoming event, at most once per
 * event per day. The audit entry written after a successful send is the
 * record of that, so a failed send can be retried; batch idempotency keys stop
 * a double-click from sending twice.
 */
export async function sendEventAnnouncement(formData: FormData) {
  const viewer = await requireStaffAction("officer");
  const eventId = uuidSchema.safeParse(formData.get("event_id"));
  if (!eventId.success) redirect("/admin/events");
  const back = `/admin/events/${eventId.data}`;

  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("*").eq("id", eventId.data).maybeSingle();
  if (!event || !isEventUpcoming(event)) redirect(`${back}?error=announcement_unavailable`);
  if (!(await hitRateLimit(LIMITS.staffSensitivePerActor, viewer.id))) redirect(`${back}?error=rate_limited`);

  const admin = createAdminClient();
  const { count: sentToday, error: sentError } = await admin
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("action", "event.announcement_sent")
    .eq("details->>event_id", eventId.data)
    .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (sentError) throw sentError;
  if (sentToday) redirect(`${back}?error=announcement_rate_limited`);

  const recipients: { id: string; full_name: string | null }[] = [];
  for (let from = 0; ; from += RECIPIENT_PAGE) {
    const { data, error } = await admin
      .from("profiles")
      .select("id, full_name")
      .eq("notify_events", true)
      .eq("membership_status", "active")
      .not("student_email_verified_at", "is", null)
      .order("id")
      .range(from, from + RECIPIENT_PAGE - 1);
    if (error) throw error;
    recipients.push(...data);
    if (data.length < RECIPIENT_PAGE) break;
  }

  // Event emails go to the sign-in address, which members keep after graduation.
  const emails = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (listError) throw listError;
    data.users.forEach((user) => user.email && emails.set(user.id, user.email));
    if (data.users.length < 1000) break;
  }

  const when = formatEventRange(event.starts_at, event.ends_at);
  const dashboard = absoluteUrl("/dashboard");
  const messages: EmailMessage[] = recipients.flatMap((member) => {
    const to = emails.get(member.id);
    if (!to) return [];
    const { page } = unsubscribeLinks(member.id);
    const details = [when, event.location].filter(Boolean).join(" · ");
    return [{
      to,
      subject: `${event.title}: ${when}`,
      text: `Hi ${member.full_name ?? "there"},\n\n${event.title}\n${details}\n\n${event.description}\n\nRSVP on your dashboard: ${dashboard}\n\nStop event emails: ${page}`,
      html: renderEmail({
        heading: event.title,
        paragraphs: [`Hi ${member.full_name ?? "there"},`, details, ...event.description.split(/\n{2,}/).filter(Boolean)],
        action: { label: "RSVP on your dashboard", url: dashboard },
        footer: `You get these because you turned on event emails at ${branding.displayName}.`,
        unsubscribeUrl: page,
      }),
      headers: unsubscribeHeaders(member.id),
    }];
  });

  try {
    await sendEmailBatch(messages, `event-announcement/${eventId.data}/${new Date().toISOString().slice(0, 10)}`);
  } catch (sendError) {
    console.error("[staff] announcement send failed", sendError);
    redirect(`${back}?error=announcement_failed`);
  }
  const { error: auditError } = await admin.from("audit_log").insert({
    actor_id: viewer.id,
    action: "event.announcement_sent",
    details: { event_id: eventId.data, recipients: messages.length },
  });
  if (auditError) console.error("[staff] announcement audit failed", auditError);
  redirect(`${back}?notice=announced&count=${messages.length}`);
}
