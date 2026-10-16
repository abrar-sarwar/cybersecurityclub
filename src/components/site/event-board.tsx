import { CalendarDays } from "lucide-react";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { EventBadges, EventFacts, EventFlyer, EventMaterials, EventRegistration } from "@/components/events/event-details";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import type { ClubEvent } from "@/lib/events/event";
import { formatEventDate, formatTimeRange } from "@/lib/events/format";

/**
 * The events page's two lists, fed from the events database. Upcoming
 * events lead: the next one is a large card with everything needed to turn
 * up, and any after it are compact rows. Past events are an archive with
 * whatever materials were shared afterwards.
 */

function NextEvent({ event, today }: { event: ClubEvent; today: string }) {
  const cancelled = event.status === "cancelled";
  return (
    <article className="ev-next" data-flyer={event.imageUrl ? "" : undefined} aria-labelledby={`next-${event.id}`}>
      {event.imageUrl ? (
        <div className="ev-next-flyer">
          <EventFlyer event={event} eager />
        </div>
      ) : null}
      <div>
        <p className="ev-flag" data-cancelled={cancelled ? "" : undefined}>
          <span className="ev-flag-pulse" aria-hidden="true" />
          {cancelled ? "Cancelled" : event.date === today ? "Happening today" : "Next up"}
        </p>
        <h3 id={`next-${event.id}`} className="ev-next-title">
          {event.title}
        </h3>
        <EventBadges event={event} className="mt-3" />
        <EventFacts event={event} />
        {event.description ? <p className="ev-next-summary">{event.description}</p> : null}
        {cancelled ? <p className="ev-cancelled-note">This event has been cancelled. Watch Discord for what replaces it.</p> : null}
        <EventMaterials event={event} className="mt-3" />
        <div className="ev-actions">
          <EventRegistration event={event} size="lg" />
        </div>
      </div>
    </article>
  );
}

/** `today` is resolved once on the server in the club's own timezone and passed in. */
export function UpcomingEvents({ events, today }: { events: readonly ClubEvent[]; today: string }) {
  if (!events.length) {
    return (
      <EmptyState
        icon={<CalendarDays className="size-5" />}
        title="Nothing on the calendar right now"
        description="New events are announced in Discord first and show up here as soon as they are confirmed. Join the server so you do not miss the next one."
        action={
          <>
            <ButtonLink href={branding.links.discordInvite} variant="discord" external>
              <DiscordMark />
              Join Discord
            </ButtonLink>
            <ButtonLink href={branding.links.pinEvents} variant="outline" external>
              Events on PIN
            </ButtonLink>
          </>
        }
      />
    );
  }

  const [next, ...later] = events;
  return (
    <>
      <NextEvent event={next} today={today} />
      {later.length ? (
        <>
          <h3 className="ev-heading">Also coming up</h3>
          <ol className="ev-list">
            {later.map((event) => {
              const time = formatTimeRange(event.startTime, event.endTime);
              return (
                <li key={event.id} className="ev-row !items-start" data-cancelled={event.status === "cancelled" ? "" : undefined}>
                  <time className="ev-row-date" dateTime={event.date}>
                    <span>{formatEventDate(event.date, { month: "short" })}</span>
                    <b>{formatEventDate(event.date, { day: "numeric" })}</b>
                  </time>
                  <div>
                    <h4 className="ev-row-title">{event.title}</h4>
                    <p className="ev-row-detail">{[formatEventDate(event.date, { weekday: "long" }), time ?? "Time TBA", event.location ?? "Location TBA"].join(" · ")}</p>
                    <EventBadges event={event} className="mt-2" />
                    {event.description ? <p className="ev-row-detail">{event.description}</p> : null}
                    <EventMaterials event={event} className="mt-2" />
                  </div>
                  <EventRegistration event={event} size="sm" />
                </li>
              );
            })}
          </ol>
        </>
      ) : null}
      <p className="ev-note">All times are Eastern. Registration happens on PIN, the official GSU student organization portal.</p>
    </>
  );
}

export function PastEvents({ events }: { events: readonly ClubEvent[] }) {
  if (!events.length) {
    return <p className="mt-4 text-muted">No past events yet. Once an event has happened it moves here, along with any slides or recordings.</p>;
  }
  return (
    <ol className="mt-6 grid gap-4 md:grid-cols-2">
      {events.map((event) => (
        <li key={event.id} className="card flex gap-4 p-4">
          {event.imageUrl ? (
            <div className="ev-past-thumb w-[4.5rem] flex-none self-start">
              {/* The flyer repeats the title and date beside it, so it is decorative here. */}
              <EventFlyer event={event} decorative />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              <time dateTime={event.date}>{formatEventDate(event.date, { month: "long", day: "numeric", year: "numeric" })}</time>
            </p>
            <h3 className="ev-row-title mt-1">{event.title}</h3>
            <EventBadges event={event} className="mt-2" />
            {event.description ? <p className="ev-row-detail mt-2">{event.description}</p> : null}
            {event.links.length ? <EventMaterials event={event} className="mt-3" /> : <p className="mt-3 text-sm text-muted">No materials posted.</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Shown when the events database could not be read and nothing good is cached. Never pretends the calendar is empty. */
export function EventsUnavailable() {
  return (
    <div role="status">
      <EmptyState
        icon={<CalendarDays className="size-5" />}
        title="The events list is not available right now"
        description="We could not load the calendar. Upcoming events are also listed on PIN and announced in Discord."
        action={
          <>
            <ButtonLink href={branding.links.pinEvents} external>
              Events on PIN
            </ButtonLink>
            <ButtonLink href={branding.links.discordInvite} variant="discord" external>
              <DiscordMark />
              Join Discord
            </ButtonLink>
          </>
        }
      />
    </div>
  );
}

export function EventsLoading() {
  return (
    <p className="container-x ev-loading" role="status" aria-live="polite">
      Loading events…
    </p>
  );
}
