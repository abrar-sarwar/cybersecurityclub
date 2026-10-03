import { CalendarDays } from "lucide-react";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { EventBadges, EventFacts, EventMaterials, EventRegistration, TbdSlots } from "@/components/events/event-details";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { formatEventDate, formatEventTime, type ClubEvent } from "@/content/club/events";

/**
 * The events page's two lists. Upcoming events lead: the next one is a large
 * card with everything needed to turn up, and any after it are compact rows.
 * Past events are an archive with whatever materials were shared afterwards.
 */

function NextEvent({ event, today }: { event: ClubEvent; today: string }) {
  return (
    <article className="ev-next" data-flyer={event.flyer ? "" : undefined} aria-labelledby={`next-${event.id}`}>
      {event.flyer ? (
        <div className="ev-next-flyer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.flyer.image} alt={event.flyer.alt} width={event.flyer.width} height={event.flyer.height} decoding="async" />
        </div>
      ) : null}
      <div>
        <p className="ev-flag">
          <span className="ev-flag-pulse" aria-hidden="true" />
          {event.date === today ? "Happening today" : "Next up"}
        </p>
        <h3 id={`next-${event.id}`} className="ev-next-title">
          {event.title}
        </h3>
        <EventBadges event={event} className="mt-3" />
        <EventFacts event={event} />
        {event.description ? <p className="ev-next-summary">{event.description}</p> : null}
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
      <>
          <h3 className="ev-heading">Also coming up</h3>
          <ol className="ev-list">
            {later.map((event) => {
              const time = formatEventTime(event);
              return (
                <li key={event.id} className="ev-row !items-start">
                  <time className="ev-row-date" dateTime={event.date}>
                    <span>{formatEventDate(event.date, { month: "short" })}</span>
                    <b>{formatEventDate(event.date, { day: "numeric" })}</b>
                  </time>
                  <div>
                    <h4 className="ev-row-title">{event.title}</h4>
                    <p className="ev-row-detail">
                      {[formatEventDate(event.date, { weekday: "long" }), time ?? "Time TBA", event.location ?? "Location TBA"].join(" · ")}
                    </p>
                    <EventBadges event={event} className="mt-2" />
                    {event.description ? <p className="ev-row-detail">{event.description}</p> : null}
                    <EventMaterials event={event} className="mt-2" />
                  </div>
                  <EventRegistration event={event} size="sm" />
                </li>
              );
            })}
            <TbdSlots count={2 - later.length} />
          </ol>
        </>
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
          {event.flyer ? (
            <div className="ev-past-thumb w-[4.5rem] flex-none self-start">
              {/* The flyer repeats the title and date beside it, so it is decorative here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={event.flyer.image} alt="" width={event.flyer.width} height={event.flyer.height} loading="lazy" decoding="async" />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              <time dateTime={event.date}>{formatEventDate(event.date, { month: "long", day: "numeric", year: "numeric" })}</time>
            </p>
            <h3 className="ev-row-title mt-1">{event.title}</h3>
            <EventBadges event={event} className="mt-2" />
            {event.description ? <p className="ev-row-detail mt-2">{event.description}</p> : null}
            {event.links?.length ? <EventMaterials event={event} className="mt-3" /> : <p className="mt-3 text-sm text-muted">No materials posted.</p>}
          </div>
        </li>
      ))}
      <TbdSlots count={events.length % 2} className="max-md:hidden" />
    </ol>
  );
}
