"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  changeStudentEmailSchema,
  fieldErrors,
  notifyEventsSchema,
  onboardingSchema,
  settingsSchema,
  uuidSchema,
  verificationTokenSchema,
} from "@/lib/portal-schemas";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hashToken } from "@/lib/tokens";
import { hitIpRateLimit, hitRateLimit, LIMITS } from "@/server/rate-limit";
import { getViewer } from "@/server/session";
import { sendStudentEmailVerification, type VerificationSendResult } from "@/server/student-email";
import { unsubscribeFromEventEmails } from "@/server/unsubscribe";

export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, unknown>;
};

function profileInput(formData: FormData) {
  return {
    full_name: formData.get("full_name"),
    grad_month: formData.get("grad_month"),
    grad_year: formData.get("grad_year"),
    major: formData.get("major"),
    interests: formData.getAll("interests"),
    notify_events: formData.get("notify_events"),
  };
}

const VERIFICATION_MESSAGES: Record<Exclude<VerificationSendResult, "sent">, string> = {
  rate_limited: "Too many verification emails were requested. Wait an hour, then resend from your dashboard.",
  in_use: "That student email is already verified on another account. Contact an officer if it belongs to you.",
  already_verified: "Your student email is already verified.",
  send_failed: "We saved your details but could not send the email. Use the resend button on your dashboard.",
};

export async function completeOnboarding(_previous: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/join?next=/onboarding");

  const input = { ...profileInput(formData), student_email: formData.get("student_email") ?? viewer.profile.student_email };
  const parsed = onboardingSchema.safeParse(input);
  const values = { ...input, interests: formData.getAll("interests") };
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const { student_email, ...editable } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(editable).eq("id", viewer.id);
  if (error) {
    console.error("[onboarding] profile update failed", error);
    return { status: "error", message: "We could not save your profile. Try again.", values };
  }

  let result: VerificationSendResult = "already_verified";
  if (!viewer.profile.student_email_verified_at) {
    result = await sendStudentEmailVerification(viewer, student_email);
    if (result === "in_use") {
      return { status: "error", errors: { student_email: VERIFICATION_MESSAGES.in_use }, values };
    }
  }

  revalidatePath("/", "layout");
  redirect(`/dashboard?verification=${result}`);
}

export async function updateSettings(_previous: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/join?next=/settings");

  const input = profileInput(formData);
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values: input };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", viewer.id);
  if (error) {
    console.error("[settings] update failed", error);
    return { status: "error", message: "We could not save your changes. Try again.", values: input };
  }
  revalidatePath("/", "layout");
  return { status: "success", message: "Your profile is saved." };
}

export async function setEventEmails(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/join?next=/dashboard");
  const parsed = notifyEventsSchema.safeParse({ notify_events: formData.get("notify_events") });
  if (!parsed.success) redirect("/dashboard?update=failed");
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", viewer.id);
  if (error) {
    console.error("[settings] notify toggle failed", error);
    redirect("/dashboard?update=failed");
  }
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function resendStudentVerification(): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/join?next=/dashboard");
  if (!viewer.profile.student_email) redirect("/onboarding");

  const result = await sendStudentEmailVerification(viewer, viewer.profile.student_email);
  if (result === "sent") return { status: "success", message: `We sent a new link to ${viewer.profile.student_email}.` };
  return { status: "error", message: VERIFICATION_MESSAGES[result] };
}

export async function changeStudentEmail(_previous: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) redirect("/join?next=/settings");
  if (viewer.profile.student_email_verified_at) {
    return { status: "error", message: "Your student email is verified. Ask an officer if it needs to change." };
  }

  const input = { student_email: formData.get("student_email") };
  const parsed = changeStudentEmailSchema.safeParse(input);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values: input };

  const result = await sendStudentEmailVerification(viewer, parsed.data.student_email);
  revalidatePath("/", "layout");
  if (result === "sent") return { status: "success", message: `We sent a verification link to ${parsed.data.student_email}.` };
  if (result === "in_use") return { status: "error", errors: { student_email: VERIFICATION_MESSAGES.in_use }, values: input };
  return { status: "error", message: VERIFICATION_MESSAGES[result] };
}

export type VerifyState = {
  status:
    | "idle"
    | "verified"
    | "already_verified"
    | "email_changed"
    | "email_in_use"
    | "wrong_account"
    | "invalid"
    | "rate_limited"
    | "signed_out";
};

/**
 * Consumes a verification token for the signed-in member only, so clicking a
 * link someone else requested cannot attach your student email to their
 * account. Runs on a button press, not on page load, so link scanners (such as
 * Microsoft Safe Links) cannot use the link up.
 */
export async function confirmStudentEmail(_previous: VerifyState, formData: FormData): Promise<VerifyState> {
  const viewer = await getViewer();
  if (!viewer) return { status: "signed_out" };
  const token = verificationTokenSchema.safeParse(formData.get("token"));
  if (!token.success) return { status: "invalid" };
  if (!(await hitRateLimit(LIMITS.verificationConfirmPerUser, viewer.id))) return { status: "rate_limited" };

  const { data, error } = await createAdminClient().rpc("consume_student_email_token", {
    p_token_hash: hashToken(token.data),
    p_user_id: viewer.id,
  });
  if (error) {
    console.error("[verify] consume failed", error);
    return { status: "invalid" };
  }
  const result = data?.[0]?.result;
  revalidatePath("/", "layout");
  switch (result) {
    case "verified":
    case "already_verified":
    case "email_changed":
    case "email_in_use":
    case "wrong_account":
      return { status: result };
    default:
      return { status: "invalid" };
  }
}

export async function rsvpToEvent(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/join?next=/dashboard");
  const eventId = uuidSchema.safeParse(formData.get("event_id"));
  if (!eventId.success || !viewer.isVerified) redirect("/dashboard?rsvp=unavailable");

  const supabase = await createClient();
  const { error } = await supabase.from("event_rsvps").insert({ event_id: eventId.data, user_id: viewer.id });
  if (error && error.code !== "23505") {
    console.error("[rsvp] insert failed", error);
    redirect("/dashboard?rsvp=unavailable");
  }
  revalidatePath("/dashboard");
}

export async function cancelRsvp(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/join?next=/dashboard");
  const eventId = uuidSchema.safeParse(formData.get("event_id"));
  if (!eventId.success) redirect("/dashboard?update=failed");
  const supabase = await createClient();
  const { error } = await supabase.from("event_rsvps").delete().eq("event_id", eventId.data).eq("user_id", viewer.id);
  if (error) {
    console.error("[rsvp] delete failed", error);
    redirect("/dashboard?update=failed");
  }
  revalidatePath("/dashboard");
}

export type UnsubscribeState = { status: "idle" | "done" | "invalid" | "rate_limited" };

export async function confirmUnsubscribe(_previous: UnsubscribeState, formData: FormData): Promise<UnsubscribeState> {
  if (!(await hitIpRateLimit(LIMITS.unsubscribePerIp))) return { status: "rate_limited" };
  const done = await unsubscribeFromEventEmails(formData.get("token"));
  if (done) revalidatePath("/", "layout");
  return { status: done ? "done" : "invalid" };
}
