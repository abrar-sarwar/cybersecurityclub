import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { branding } from "@config/branding";
import { ButtonLink } from "@/components/ui/button";
import { Badge, SectionHeading } from "@/components/ui/primitives";
import { PageHero } from "@/components/site/page-hero";
import { safeDb } from "@/server/safe-db";
import { EventBoard } from "@/components/site/event-board";
import { clubToday } from "@/lib/dates";
import { CtfCallout } from "@/components/site/ctf-callout";
import { stripMarkdown } from "@/components/marketing/sections";
import { latestSyncRun, listPastPublished, listUpcomingPublished, type EventView } from "@/server/services/events";
import { formatDate, formatEventRange } from "@/lib/dates";
import { AUDIENCE_LABELS, type AudienceLevel } from "@/lib/enums";
import { env } from "@/server/env";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming meetings, workshops and competitions, with preparation notes and RSVP links on PIN.",
  alternates: { canonical: "/events" },
};

export const dynamic = "force-dynamic";

function EventRow({ event }: { event: EventView }) {
  const cancelled = event.status === "cancelled";
  return (
    <li className="flex flex-col gap-4 border-t border-line py-7 sm:flex-row sm:items-start sm:gap-8">
      <div className="flex shrink-0 items-center gap-3 sm:w-24 sm:flex-col sm:items-start sm:gap-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">{formatDate(event.startsAt).split(",")[1]?.trim().split(" ")[0]}</p>
        <p className="font-display text-3xl font-extrabold leading-none text-navy-900">{new Date(event.startsAt).toLocaleDateString("en-US", { day: "numeric", timeZone: branding.timezone })}</p>
        <p className="text-sm text-muted">{formatDate(event.startsAt).split(",")[0]}</p>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {cancelled ? <Badge tone="danger">Cancelled</Badge> : null}
          <Badge tone={event.audienceLevel === "beginner" ? "cyan" : "brand"}>{AUDIENCE_LABELS[event.audienceLevel as AudienceLevel] ?? "All levels"}</Badge>
          {event.source === "pin" ? <Badge tone="muted">Synced from PIN</Badge> : null}
        </div>
        <h3 className="mt-2 font-display text-xl font-bold text-navy-900">
          <Link href={`/events/${event.slug}`} className={cancelled ? "line-through decoration-danger-600/60 hover:text-brand-700" : "hover:text-brand-700"}>
            {event.title}
          </Link>
        </h3>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 text-accent" aria-hidden />
            {formatEventRange(event.startsAt, event.endsAt)}
          </span>
          {event.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4 text-accent" aria-hidden />
              {event.location}
            </span>
          ) : null}
        </p>
        {event.description ? <p className="mt-2 line-clamp-2 text-[0.95rem] leading-6 text-muted">{stripMarkdown(event.description)}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {event.pinUrl && !cancelled ? (
            <ButtonLink href={event.pinUrl} size="sm" external>
              RSVP on PIN
            </ButtonLink>
          ) : null}
          <ButtonLink href={`/events/${event.slug}`} size="sm" variant="outline">
            Details and preparation
          </ButtonLink>
        </div>
      </div>
    </li>
  );
}

export default async function EventsPage() {
  const [upcoming, past, sync] = await Promise.all([
    safeDb(() => listUpcomingPublished(), [], "upcoming events"),
    safeDb(() => listPastPublished(), [], "past events"),
    safeDb(() => latestSyncRun(), null, "sync run"),
  ]);
  // Reading configuration must not be able to take the page down: the flyers,
  // the timeline and the CTF call-out are file-backed and always renderable.
  let pinEnabled = false;
  try {
    pinEnabled = env().PIN_SYNC_ENABLED;
  } catch (error) {
    console.error("[env] events page:", (error as Error).message);
  }

  return (
    <>
      <PageHero
        eyebrow="Events"
        title="Meetings, workshops and competitions"
        description="All times are shown in Eastern time. RSVPs happen on PIN, the official GSU student organization portal."
      >
        <ButtonLink href={branding.links.pinEvents} size="lg" external>
          Events on PIN
        </ButtonLink>
        <ButtonLink href={branding.links.discordInvite} variant="outline" size="lg" external>
          Join Discord
        </ButtonLink>
      </PageHero>

      <section className="container-x pt-14">
        <CtfCallout />
      </section>

      <section className="container-x section" aria-labelledby="upcoming">
        <p className="max-w-3xl text-sm leading-6 text-muted">
          {pinEnabled
            ? sync?.finishedAt
              ? `Automatically synchronized from the club's public PIN feed. Last successful check: ${formatDate(sync.finishedAt)} at ${new Date(sync.finishedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: branding.timezone })} Eastern${sync.status === "error" ? " (the last check reported an error)" : ""}.`
              : "Automatic synchronization from PIN is enabled but has not run yet. Events below are maintained by officers."
            : "Events are maintained manually by officers and mirrored from PIN."}{" "}
          <a href={branding.links.pinEvents} className="text-brand-700 underline underline-offset-2" target="_blank" rel="noopener noreferrer">
            See the official list on PIN
          </a>
          .
        </p>
        <SectionHeading id="upcoming" eyebrow="On the calendar" title="Upcoming events" className="mt-8" />
        {upcoming.length ? (
          <ul className="mt-6 space-y-4">
            {upcoming.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </ul>
        ) : null}
        <EventBoard today={clubToday()} />
      </section>

      {past.length ? (
        <section className="surface-pale border-t border-line section" aria-labelledby="past">
          <div className="container-x">
            <SectionHeading id="past" eyebrow="Archive" title="Recent events" />
            <ul className="mt-6 grid gap-4 md:grid-cols-2">
              {past.map((e) => (
                <li key={e.id} className="card p-5">
                  <p className="text-sm text-muted">{formatDate(e.startsAt)}</p>
                  <h3 className="mt-1 font-display text-lg font-bold text-navy-900">
                    <Link href={`/events/${e.slug}`} className="hover:text-brand-700">
                      {e.title}
                    </Link>
                  </h3>
                  {e.followUp ? <p className="mt-1 text-sm text-brand-700">Follow-up materials available</p> : null}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
