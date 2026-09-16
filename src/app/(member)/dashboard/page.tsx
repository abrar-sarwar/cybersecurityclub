import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Compass, Lock, MapPin, Settings, ShieldCheck, Trophy } from "lucide-react";
import { ResendVerificationForm } from "@/components/portal/member-forms";
import { SubmitButton } from "@/components/portal/submit-button";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Badge } from "@/components/ui/primitives";
import { formatEventRange } from "@/lib/dates";
import { formatGraduation, ROLE_LABELS } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/server/actions/auth";
import { cancelRsvp, rsvpToEvent, setEventEmails } from "@/server/actions/member";
import { requireMember } from "@/server/session";

export const metadata: Metadata = { title: "Dashboard" };

const VERIFICATION_NOTICES: Record<string, { tone: "success" | "warning"; text: string }> = {
  sent: { tone: "success", text: "Check your GSU inbox for a link to confirm your student email. It expires in 24 hours." },
  rate_limited: { tone: "warning", text: "Your profile is saved. Too many verification emails were requested recently, so resend the link a little later." },
  send_failed: { tone: "warning", text: "Your profile is saved, but the verification email could not be sent. Use the resend button below." },
};

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const viewer = await requireMember("/dashboard");
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: nextEvent }, { data: activity }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, location, starts_at, ends_at")
      .or(`ends_at.gt.${now},and(ends_at.is.null,starts_at.gt.${now})`)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("activity").select("type").eq("user_id", viewer.id),
  ]);

  const { data: rsvp } = nextEvent
    ? await supabase.from("event_rsvps").select("event_id").eq("event_id", nextEvent.id).eq("user_id", viewer.id).maybeSingle()
    : { data: null };

  const workshops = activity?.filter((row) => row.type === "workshop_attended").length ?? 0;
  const challenges = activity?.filter((row) => row.type === "challenge_completed").length ?? 0;
  const { profile } = viewer;
  const firstName = profile.full_name?.split(/\s+/)[0] ?? "there";
  const notice = typeof searchParams.verification === "string" ? VERIFICATION_NOTICES[searchParams.verification] : undefined;

  return (
    <section className="container-x py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Member dashboard</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">Welcome, {firstName}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {viewer.isOfficer ? <ButtonLink href="/admin" variant="secondary" size="sm">Officer tools</ButtonLink> : null}
          <form action={signOut}>
            <SubmitButton variant="ghost" size="sm" pendingText="Signing out">Sign out</SubmitButton>
          </form>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {notice ? <Alert tone={notice.tone}>{notice.text}</Alert> : null}
        {searchParams.rsvp === "unavailable" ? <Alert tone="warning">That RSVP could not be saved. RSVPs open once your student email is verified.</Alert> : null}
        {searchParams.update === "failed" ? <Alert tone="danger">That change could not be saved. Try again.</Alert> : null}
        {viewer.isSuspended ? (
          <Alert tone="danger" title="Your membership is suspended">Member features are paused. Contact an officer if you think this is a mistake.</Alert>
        ) : null}
        {!profile.student_email_verified_at ? (
          <div className="flex flex-col gap-4 rounded-xl border border-amber-300 bg-warning-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" role="status">
            <div className="text-sm leading-6 text-warning-700">
              <p className="font-semibold">Verify your student email</p>
              <p>
                We sent a link to <span className="font-medium">{profile.student_email}</span>. RSVPs and other student features unlock after you confirm it.{" "}
                <Link href="/settings#student-email" className="font-semibold underline underline-offset-2">Wrong address?</Link>
              </p>
            </div>
            <ResendVerificationForm />
          </div>
        ) : null}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <article className="card flex flex-col p-6 lg:col-span-2" aria-labelledby="next-event">
          <h2 id="next-event" className="flex items-center gap-2 font-display text-lg font-bold text-navy-900">
            <CalendarDays className="size-5 text-accent" aria-hidden /> Next event
          </h2>
          {nextEvent ? (
            <div className="mt-4 flex flex-1 flex-col">
              <p className="font-display text-2xl font-bold text-navy-900">{nextEvent.title}</p>
              <p className="mt-2 text-sm text-muted">{formatEventRange(nextEvent.starts_at, nextEvent.ends_at)}</p>
              {nextEvent.location ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="size-4" aria-hidden /> {nextEvent.location}
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {rsvp ? (
                  <>
                    <Badge tone="success"><CheckCircle2 className="size-3.5" aria-hidden /> You are going</Badge>
                    <form action={cancelRsvp}>
                      <input type="hidden" name="event_id" value={nextEvent.id} />
                      <SubmitButton variant="ghost" size="sm" pendingText="Updating">Cancel RSVP</SubmitButton>
                    </form>
                  </>
                ) : viewer.isVerified ? (
                  <form action={rsvpToEvent}>
                    <input type="hidden" name="event_id" value={nextEvent.id} />
                    <SubmitButton pendingText="Saving">RSVP</SubmitButton>
                  </form>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-muted">
                    <Lock className="size-4" aria-hidden /> RSVP opens after you verify your student email.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">
              No upcoming events are posted yet. Check <Link href="/events" className="text-accent underline-offset-2 hover:underline">the events page</Link> or Discord.
            </p>
          )}
        </article>

        <article className="card p-6" aria-labelledby="membership">
          <h2 id="membership" className="flex items-center gap-2 font-display text-lg font-bold text-navy-900">
            <ShieldCheck className="size-5 text-accent" aria-hidden /> Membership
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Student email</dt>
              <dd>{profile.student_email_verified_at ? <Badge tone="success">Verified</Badge> : <Badge tone="warning">Not verified</Badge>}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Role</dt>
              <dd><Badge tone="muted">{ROLE_LABELS[profile.role]}</Badge></dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted">Graduation</dt>
              <dd className="text-ink">{formatGraduation(profile)}</dd>
            </div>
          </dl>
          <Link href="/settings" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent underline-offset-4 hover:underline">
            <Settings className="size-4" aria-hidden /> Profile settings
          </Link>
        </article>

        <article className="card p-6" aria-labelledby="activity">
          <h2 id="activity" className="flex items-center gap-2 font-display text-lg font-bold text-navy-900">
            <Trophy className="size-5 text-accent" aria-hidden /> Your activity
          </h2>
          {workshops + challenges > 0 ? (
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-pale-2 p-4">
                <dt className="text-xs font-medium text-muted">Workshops attended</dt>
                <dd className="mt-1 font-display text-3xl font-bold text-navy-900">{workshops}</dd>
              </div>
              <div className="rounded-lg bg-pale-2 p-4">
                <dt className="text-xs font-medium text-muted">Challenges completed</dt>
                <dd className="mt-1 font-display text-3xl font-bold text-navy-900">{challenges}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted">
              Nothing here yet. Officers check you in at workshops and record completed challenges, and they show up here.
            </p>
          )}
        </article>

        <article className="card p-6" aria-labelledby="get-started">
          <h2 id="get-started" className="flex items-center gap-2 font-display text-lg font-bold text-navy-900">
            <Compass className="size-5 text-accent" aria-hidden /> Get started
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted">New to security? Start with the beginner learning paths, then bring questions to the next meeting.</p>
          <ButtonLink href="/learn" variant="outline" size="sm" className="mt-4">Beginner resources</ButtonLink>
        </article>

        <article className="card p-6" aria-labelledby="notifications">
          <h2 id="notifications" className="font-display text-lg font-bold text-navy-900">Notification settings</h2>
          <form action={setEventEmails} className="mt-4 space-y-3">
            <input type="hidden" name="notify_events" value={profile.notify_events ? "false" : "true"} />
            <p className="text-sm leading-6 text-muted">
              Event emails are <span className="font-semibold text-ink">{profile.notify_events ? "on" : "off"}</span>.
            </p>
            <SubmitButton variant="outline" size="sm" pendingText="Updating" aria-pressed={profile.notify_events}>
              {profile.notify_events ? "Turn off event emails" : "Turn on event emails"}
            </SubmitButton>
          </form>
        </article>
      </div>
    </section>
  );
}
