import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { StaffHeading } from "@/components/portal/staff-ui";
import { SubmitButton } from "@/components/portal/submit-button";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { formatEventRange } from "@/lib/dates";
import { isEventUpcoming } from "@/lib/portal";
import { uuidSchema } from "@/lib/portal-schemas";
import { createClient } from "@/lib/supabase/server";
import { sendEventAnnouncement } from "@/server/actions/staff";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Email members" };

export default async function AnnounceEventPage(props: PageProps<"/admin/events/[id]/announce">) {
  const { id } = await props.params;
  await requireStaff("officer", `/admin/events/${id}/announce`);
  const eventId = uuidSchema.safeParse(id);
  if (!eventId.success) notFound();

  const supabase = await createClient();
  const [{ data: event }, { count }] = await Promise.all([
    supabase.from("events").select("id, title, location, starts_at, ends_at").eq("id", eventId.data).maybeSingle(),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("notify_events", true)
      .eq("membership_status", "active")
      .not("student_email_verified_at", "is", null),
  ]);
  if (!event) notFound();
  const back = `/admin/events/${event.id}`;
  if (!isEventUpcoming(event)) redirect(`${back}?error=announcement_unavailable`);
  const recipients = count ?? 0;

  return (
    <div className="max-w-2xl space-y-6">
      <StaffHeading back={{ href: back, label: event.title }} title="Email members about this event" />
      <div className="card space-y-5 p-6">
        <div className="text-sm leading-6">
          <p className="font-display text-lg font-bold text-navy-900">{event.title}</p>
          <p className="text-muted">{formatEventRange(event.starts_at, event.ends_at)}{event.location ? ` · ${event.location}` : ""}</p>
        </div>
        <Alert tone="brand">
          Sends to {recipients} verified member{recipients === 1 ? "" : "s"} who turned on event emails. Each email includes an unsubscribe link.
          You can send once per event every 24 hours.
        </Alert>
        <form action={sendEventAnnouncement} className="flex flex-wrap gap-3">
          <input type="hidden" name="event_id" value={event.id} />
          <SubmitButton disabled={recipients === 0} pendingText="Sending">Send email</SubmitButton>
          <ButtonLink href={back} variant="ghost">Cancel</ButtonLink>
        </form>
      </div>
    </div>
  );
}
