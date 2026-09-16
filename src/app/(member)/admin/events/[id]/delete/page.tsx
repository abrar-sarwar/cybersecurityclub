import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StaffHeading } from "@/components/portal/staff-ui";
import { SubmitButton } from "@/components/portal/submit-button";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/primitives";
import { formatEventRange } from "@/lib/dates";
import { uuidSchema } from "@/lib/portal-schemas";
import { createClient } from "@/lib/supabase/server";
import { deleteEvent } from "@/server/actions/staff";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Delete event" };

export default async function DeleteEventPage(props: PageProps<"/admin/events/[id]/delete">) {
  const { id } = await props.params;
  await requireStaff("admin", `/admin/events/${id}/delete`);
  const eventId = uuidSchema.safeParse(id);
  if (!eventId.success) notFound();

  const supabase = await createClient();
  const { data: event } = await supabase.from("events").select("id, title, starts_at, ends_at").eq("id", eventId.data).maybeSingle();
  if (!event) notFound();
  const back = `/admin/events/${event.id}`;

  return (
    <div className="max-w-2xl space-y-6">
      <StaffHeading back={{ href: back, label: event.title }} title="Delete this event?" />
      <div className="card space-y-5 p-6">
        <p className="text-sm text-muted">{event.title} · {formatEventRange(event.starts_at, event.ends_at)}</p>
        <Alert tone="danger">
          Deleting removes its RSVPs and check-in records. Workshop activity already awarded stays on member profiles. This cannot be undone.
        </Alert>
        <form action={deleteEvent} className="flex flex-wrap gap-3">
          <input type="hidden" name="event_id" value={event.id} />
          <SubmitButton variant="danger" pendingText="Deleting">Delete event</SubmitButton>
          <ButtonLink href={back} variant="ghost">Cancel</ButtonLink>
        </form>
      </div>
    </div>
  );
}
