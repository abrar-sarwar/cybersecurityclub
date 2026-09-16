import type { Metadata } from "next";
import Link from "next/link";
import { StaffHeading, StaffNotice, TableShell, td, th } from "@/components/portal/staff-ui";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { formatEventRange } from "@/lib/dates";
import { isEventUpcoming } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Events" };

export default async function StaffEventsPage(props: PageProps<"/admin/events">) {
  await requireStaff("officer", "/admin/events");
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, location, starts_at, ends_at, event_rsvps(count), event_attendance(count)")
    .order("starts_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  const upcoming = events.filter((event) => isEventUpcoming(event)).reverse();
  const past = events.filter((event) => !isEventUpcoming(event));

  const table = (rows: typeof events) => (
    <TableShell>
      <thead>
        <tr>
          <th scope="col" className={th}>Event</th>
          <th scope="col" className={th}>When</th>
          <th scope="col" className={th}>RSVPs</th>
          <th scope="col" className={th}>Checked in</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((event) => (
          <tr key={event.id} className="hover:bg-pale-2/60">
            <td className={td}>
              <Link href={`/admin/events/${event.id}`} className="font-semibold text-navy-900 hover:text-brand-700 hover:underline">{event.title}</Link>
              {event.location ? <span className="block text-xs text-muted">{event.location}</span> : null}
            </td>
            <td className={td}>{formatEventRange(event.starts_at, event.ends_at)}</td>
            <td className={td}>{event.event_rsvps[0]?.count ?? 0}</td>
            <td className={td}>{event.event_attendance[0]?.count ?? 0}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );

  return (
    <div className="space-y-6">
      <StaffHeading
        title="Events"
        description="Portal events power the dashboard, RSVPs and check-in. The public events page still lists PIN events separately."
        action={<ButtonLink href="/admin/events/new">New event</ButtonLink>}
      />
      <StaffNotice searchParams={searchParams} />
      <section className="space-y-3" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="font-display text-lg font-bold text-navy-900">Upcoming</h2>
        {upcoming.length ? table(upcoming) : <EmptyState title="No upcoming events" description="Create one so members can RSVP from their dashboard." />}
      </section>
      <section className="space-y-3" aria-labelledby="past-heading">
        <h2 id="past-heading" className="font-display text-lg font-bold text-navy-900">Past</h2>
        {past.length ? table(past) : <EmptyState title="No past events yet" />}
      </section>
    </div>
  );
}
