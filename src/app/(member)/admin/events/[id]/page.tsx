import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventForm } from "@/components/portal/staff-forms";
import { StaffHeading, StaffNotice, TableShell, td, th, VerificationBadge } from "@/components/portal/staff-ui";
import { SubmitButton } from "@/components/portal/submit-button";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/primitives";
import { formatDateTimeLocalInput, formatEventRange, formatTime } from "@/lib/dates";
import { isEventUpcoming } from "@/lib/portal";
import { memberSearchSchema, uuidSchema } from "@/lib/portal-schemas";
import { createClient } from "@/lib/supabase/server";
import { checkInMember, undoCheckIn } from "@/server/actions/staff";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Event" };

function CheckInButton({ eventId, userId, checkedIn }: { eventId: string; userId: string; checkedIn: boolean }) {
  return (
    <form action={checkedIn ? undoCheckIn : checkInMember}>
      <input type="hidden" name="event_id" value={eventId} />
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="return_to" value={`/admin/events/${eventId}`} />
      <SubmitButton size="sm" variant={checkedIn ? "ghost" : "secondary"} pendingText="Saving">
        {checkedIn ? "Undo check-in" : "Check in"}
      </SubmitButton>
    </form>
  );
}

export default async function StaffEventPage(props: PageProps<"/admin/events/[id]">) {
  const { id } = await props.params;
  const viewer = await requireStaff("officer", `/admin/events/${id}`);
  const eventId = uuidSchema.safeParse(id);
  if (!eventId.success) notFound();
  const searchParams = await props.searchParams;
  const { q } = memberSearchSchema.parse({ q: searchParams.q });
  const supabase = await createClient();

  const [{ data: event }, { data: rsvps }, { data: attendance }] = await Promise.all([
    supabase.from("events").select("*").eq("id", eventId.data).maybeSingle(),
    supabase
      .from("event_rsvps")
      .select("user_id, created_at, profiles(id, full_name, student_email, student_email_verified_at)")
      .eq("event_id", eventId.data)
      .order("created_at", { ascending: true }),
    supabase
      .from("event_attendance")
      .select("user_id, checked_in_at, member:profiles!event_attendance_user_id_fkey(id, full_name, student_email)")
      .eq("event_id", eventId.data)
      .order("checked_in_at", { ascending: true }),
  ]);
  if (!event) notFound();

  const checkedIn = new Set((attendance ?? []).map((row) => row.user_id));
  const { data: searchResults } = q
    ? await supabase
        .from("profiles")
        .select("id, full_name, student_email, student_email_verified_at")
        .or(`full_name.ilike."*${q}*",student_email.ilike."*${q}*"`)
        .order("full_name")
        .limit(10)
    : { data: null };
  const upcoming = isEventUpcoming(event);

  return (
    <div className="space-y-8">
      <StaffHeading
        back={{ href: "/admin/events", label: "Events" }}
        title={event.title}
        description={`${formatEventRange(event.starts_at, event.ends_at)}${event.location ? ` · ${event.location}` : ""}`}
        action={
          <div className="flex flex-wrap gap-2">
            {upcoming ? <ButtonLink href={`/admin/events/${event.id}/announce`} variant="secondary">Email members</ButtonLink> : null}
            {viewer.isAdmin ? <ButtonLink href={`/admin/events/${event.id}/delete`} variant="ghost">Delete</ButtonLink> : null}
          </div>
        }
      />
      <StaffNotice searchParams={searchParams} />

      <section className="space-y-3" aria-labelledby="rsvps-heading">
        <h2 id="rsvps-heading" className="font-display text-lg font-bold text-navy-900">RSVPs ({rsvps?.length ?? 0})</h2>
        {rsvps?.length ? (
          <TableShell>
            <thead>
              <tr>
                <th scope="col" className={th}>Member</th>
                <th scope="col" className={th}>Student email</th>
                <th scope="col" className={th}>Verification</th>
                <th scope="col" className={th}><span className="sr-only">Check-in</span></th>
              </tr>
            </thead>
            <tbody>
              {rsvps.map((row) => row.profiles ? (
                <tr key={row.user_id}>
                  <td className={td}>{row.profiles.full_name ?? "Unnamed member"}</td>
                  <td className={td}>{row.profiles.student_email ?? "–"}</td>
                  <td className={td}><VerificationBadge profile={row.profiles} /></td>
                  <td className={`${td} text-right`}><CheckInButton eventId={event.id} userId={row.user_id} checkedIn={checkedIn.has(row.user_id)} /></td>
                </tr>
              ) : null)}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState title="No RSVPs yet" description="Verified members RSVP from their dashboard." />
        )}
      </section>

      <section className="space-y-3" aria-labelledby="attendance-heading">
        <h2 id="attendance-heading" className="font-display text-lg font-bold text-navy-900">Checked in ({attendance?.length ?? 0})</h2>
        <form method="get" className="card flex flex-wrap items-end gap-3 p-4" role="search">
          <div className="min-w-60 flex-1">
            <label htmlFor="q" className="mb-1.5 block text-sm font-semibold text-navy-900">Check in someone without an RSVP</label>
            <Input name="q" type="search" placeholder="Name or student email" defaultValue={q} />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        {searchResults ? (
          searchResults.length ? (
            <ul className="card divide-y divide-line">
              {searchResults.map((member) => (
                <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span>
                    <span className="font-medium text-navy-900">{member.full_name ?? "Unnamed member"}</span>
                    <span className="block text-muted">{member.student_email ?? "No student email"}</span>
                  </span>
                  <CheckInButton eventId={event.id} userId={member.id} checkedIn={checkedIn.has(member.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No members match “{q}”.</p>
          )
        ) : null}
        {attendance?.length ? (
          <TableShell>
            <thead>
              <tr>
                <th scope="col" className={th}>Member</th>
                <th scope="col" className={th}>Checked in</th>
                <th scope="col" className={th}><span className="sr-only">Undo</span></th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.user_id}>
                  <td className={td}>
                    {row.member?.full_name ?? "Unnamed member"}
                    <span className="block text-xs text-muted">{row.member?.student_email ?? ""}</span>
                  </td>
                  <td className={td}>{formatTime(row.checked_in_at)}</td>
                  <td className={`${td} text-right`}><CheckInButton eventId={event.id} userId={row.user_id} checkedIn /></td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : null}
      </section>

      <section className="max-w-2xl space-y-3" aria-labelledby="edit-heading">
        <h2 id="edit-heading" className="font-display text-lg font-bold text-navy-900">Edit event</h2>
        <div className="card p-6 sm:p-8">
          <EventForm
            eventId={event.id}
            initial={{
              title: event.title,
              description: event.description,
              location: event.location,
              starts_at: formatDateTimeLocalInput(new Date(event.starts_at)),
              ends_at: event.ends_at ? formatDateTimeLocalInput(new Date(event.ends_at)) : "",
            }}
          />
        </div>
      </section>
    </div>
  );
}
