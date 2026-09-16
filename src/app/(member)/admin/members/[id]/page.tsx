import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AwardChallengeForm } from "@/components/portal/staff-forms";
import { RoleBadge, StaffHeading, StaffNotice, VerificationBadge } from "@/components/portal/staff-ui";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/primitives";
import { formatDate, formatEventRange } from "@/lib/dates";
import {
  ACTIVITY_LABELS,
  formatGraduation,
  INTERESTS,
  MEMBER_ROLES,
  MEMBERSHIP_STATUS_LABELS,
  MEMBERSHIP_STATUSES,
  ROLE_LABELS,
} from "@/lib/portal";
import { uuidSchema } from "@/lib/portal-schemas";
import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/server/session";

export const metadata: Metadata = { title: "Member" };

export default async function MemberDetailPage(props: PageProps<"/admin/members/[id]">) {
  const { id } = await props.params;
  const viewer = await requireStaff("officer", `/admin/members/${id}`);
  const memberId = uuidSchema.safeParse(id);
  if (!memberId.success) notFound();
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const [{ data: member }, { data: activity }, { data: rsvps }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", memberId.data).maybeSingle(),
    supabase.from("activity").select("id, type, reference_id, created_at").eq("user_id", memberId.data).order("created_at", { ascending: false }),
    supabase.from("event_rsvps").select("created_at, events(id, title, starts_at, ends_at)").eq("user_id", memberId.data).order("created_at", { ascending: false }).limit(20),
  ]);
  if (!member) notFound();

  const eventIds = (activity ?? []).filter((row) => row.type === "workshop_attended" && row.reference_id).map((row) => row.reference_id!);
  const { data: attendedEvents } = eventIds.length
    ? await supabase.from("events").select("id, title").in("id", eventIds)
    : { data: [] as { id: string; title: string }[] };
  const eventTitles = new Map((attendedEvents ?? []).map((event) => [event.id, event.title]));
  const interestLabels = INTERESTS.filter((interest) => member.interests.includes(interest.value)).map((interest) => interest.label);
  const isSelf = member.id === viewer.id;

  return (
    <div className="space-y-6">
      <StaffHeading
        back={{ href: "/admin/members", label: "Members" }}
        title={member.full_name ?? "Unnamed member"}
        description={<span className="flex flex-wrap items-center gap-2"><RoleBadge role={member.role} /><VerificationBadge profile={member} />{member.membership_status === "suspended" ? <Badge tone="danger">Suspended</Badge> : null}</span>}
      />
      <StaffNotice searchParams={searchParams} />

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-6" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="font-display text-lg font-bold text-navy-900">Profile</h2>
          <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Student email</dt><dd className="text-ink">{member.student_email ?? "Not provided"}</dd></div>
            <div><dt className="text-muted">Verified</dt><dd className="text-ink">{member.student_email_verified_at ? formatDate(member.student_email_verified_at) : "No"}</dd></div>
            <div><dt className="text-muted">Expected graduation</dt><dd className="text-ink">{formatGraduation(member) ?? "Not provided"}</dd></div>
            <div><dt className="text-muted">Major</dt><dd className="text-ink">{member.major ?? "Not provided"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-muted">Interests</dt><dd className="text-ink">{interestLabels.length ? interestLabels.join(", ") : "None selected"}</dd></div>
            <div><dt className="text-muted">Joined</dt><dd className="text-ink">{formatDate(member.created_at)}</dd></div>
            <div><dt className="text-muted">Event emails</dt><dd className="text-ink">{member.notify_events ? "On" : "Off"}</dd></div>
          </dl>
        </section>

        <section className="card p-6" aria-labelledby="award-heading">
          <h2 id="award-heading" className="font-display text-lg font-bold text-navy-900">Record a challenge</h2>
          <p className="mt-1 mb-4 text-sm text-muted">Workshop attendance is recorded automatically when you check someone in at an event.</p>
          <AwardChallengeForm memberId={member.id} />
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="font-display text-lg font-bold text-navy-900">Activity</h2>
          {activity?.length ? (
            <ul className="mt-4 divide-y divide-line text-sm">
              {activity.map((row) => (
                <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                  <span className="text-ink">
                    {ACTIVITY_LABELS[row.type]}
                    {row.reference_id ? <span className="text-muted"> · {row.type === "workshop_attended" ? eventTitles.get(row.reference_id) ?? "Deleted event" : row.reference_id}</span> : null}
                  </span>
                  <span className="text-xs text-muted">{formatDate(row.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No activity recorded yet.</p>
          )}
        </section>

        <section className="card p-6" aria-labelledby="rsvp-heading">
          <h2 id="rsvp-heading" className="font-display text-lg font-bold text-navy-900">Recent RSVPs</h2>
          {rsvps?.length ? (
            <ul className="mt-4 divide-y divide-line text-sm">
              {rsvps.map((row) => row.events ? (
                <li key={row.events.id} className="py-2.5">
                  <span className="text-ink">{row.events.title}</span>
                  <span className="block text-xs text-muted">{formatEventRange(row.events.starts_at, row.events.ends_at)}</span>
                </li>
              ) : null)}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No RSVPs yet.</p>
          )}
        </section>
      </div>

      {viewer.isAdmin ? (
        <section className="card p-6" aria-labelledby="access-heading">
          <h2 id="access-heading" className="font-display text-lg font-bold text-navy-900">Access (admins only)</h2>
          <p className="mt-1 text-sm text-muted">Changes need a confirmation step and are recorded in the audit log.</p>
          {isSelf ? (
            <p className="mt-4 text-sm text-muted">You cannot change your own role or membership status.</p>
          ) : (
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <form method="get" action={`/admin/members/${member.id}/role`} className="space-y-2">
                <label htmlFor="to-role" className="block text-sm font-semibold text-navy-900">Role</label>
                <div className="flex gap-2">
                  <Select id="to-role" name="to" defaultValue={member.role}>
                    {MEMBER_ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                  </Select>
                  <Button type="submit" variant="outline">Review</Button>
                </div>
              </form>
              <form method="get" action={`/admin/members/${member.id}/status`} className="space-y-2">
                <label htmlFor="to-status" className="block text-sm font-semibold text-navy-900">Membership status</label>
                <div className="flex gap-2">
                  <Select id="to-status" name="to" defaultValue={member.membership_status}>
                    {MEMBERSHIP_STATUSES.map((status) => <option key={status} value={status}>{MEMBERSHIP_STATUS_LABELS[status]}</option>)}
                  </Select>
                  <Button type="submit" variant="outline">Review</Button>
                </div>
              </form>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
