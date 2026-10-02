import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { ButtonLink } from "@/components/ui/button";
import type { ClubEvent } from "@/content/club/flyers";

/**
 * The events page's two lists. Upcoming events lead: the next one is a large
 * card with everything needed to turn up, and any after it are compact rows.
 * Past events are a strip of flyers, shown but never clickable.
 */

/** Dates are plain YYYY-MM-DD days, so they are formatted in UTC to stay on that day. */
function dayParts(datetime: string) {
  const day = new Date(`${datetime}T00:00:00Z`);
  const part = (options: Intl.DateTimeFormatOptions) => day.toLocaleDateString("en-US", { timeZone: "UTC", ...options });
  return {
    weekday: part({ weekday: "long" }),
    month: part({ month: "long" }),
    monthShort: part({ month: "short" }),
    day: part({ day: "numeric" }),
  };
}

function Rsvp({ event, size }: { event: ClubEvent; size: "sm" | "lg" }) {
  return (
    <ButtonLink href={event.rsvpUrl ?? branding.links.pinEvents} size={size} external>
      {event.rsvpUrl ? "RSVP on PIN" : "Find it on PIN"}
      <ArrowUpRight className="size-4" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </ButtonLink>
  );
}

function NextEvent({ event, today }: { event: ClubEvent; today: string }) {
  const date = dayParts(event.datetime);
  return (
    <article className="ev-next" data-flyer={event.flyer ? "" : undefined}>
      {event.flyer ? (
        <div className="ev-next-flyer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.flyer.image} alt={event.flyer.alt} width={event.flyer.width} height={event.flyer.height} decoding="async" />
        </div>
      ) : null}
      <div className="ev-next-body">
        <p className="ev-flag">
          <span className="ev-flag-pulse" aria-hidden="true" />
          {event.datetime === today ? "Happening today" : "Next up"}
        </p>
        <h2 className="ev-next-title">{event.title}</h2>
        <dl className="ev-next-facts">
          <div>
            <dt>
              <CalendarDays className="size-4" aria-hidden />
              <span className="sr-only">When</span>
            </dt>
            <dd>
              <time dateTime={event.datetime}>
                {date.weekday}, {date.month} {date.day}
              </time>
            </dd>
          </div>
          <div>
            <dt>
              <MapPin className="size-4" aria-hidden />
              <span className="sr-only">Where and what time</span>
            </dt>
            <dd>{event.detail}</dd>
          </div>
        </dl>
        {event.summary ? <p className="ev-next-summary">{event.summary}</p> : null}
        <div className="ev-actions">
          <Rsvp event={event} size="lg" />
        </div>
      </div>
    </article>
  );
}

/** `today` is resolved once on the server in the club's own timezone and passed in. */
export function UpcomingEvents({ events, today }: { events: readonly ClubEvent[]; today: string }) {
  if (!events.length) {
    return (
      <div className="signal-empty">
        <span className="signal-empty-icon" aria-hidden="true">
          <CalendarDays className="size-5" />
        </span>
        <div>
          <h2 className="ev-empty-title">Nothing on the calendar right now</h2>
          <p className="ev-empty-text">New events are announced on PIN and in Discord first, and show up here as soon as they are confirmed.</p>
          <div className="ev-actions">
            <ButtonLink href={branding.links.pinEvents} external>
              Events on PIN
            </ButtonLink>
            <ButtonLink href={branding.links.discordInvite} variant="discord" external>
              <DiscordMark />
              Join Discord
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const [next, ...later] = events;
  return (
    <>
      <NextEvent event={next} today={today} />
      {later.length ? (
        <>
          <h2 className="ev-heading">Also coming up</h2>
          <ol className="ev-list">
            {later.map((event) => {
              const date = dayParts(event.datetime);
              return (
                <li key={`${event.datetime}-${event.title}`} className="ev-row">
                  <time className="ev-row-date" dateTime={event.datetime}>
                    <span>{date.monthShort}</span>
                    <b>{date.day}</b>
                  </time>
                  <div className="ev-row-body">
                    <h3 className="ev-row-title">{event.title}</h3>
                    <p className="ev-row-detail">
                      {date.weekday}
                      {event.detail ? ` · ${event.detail}` : ""}
                    </p>
                  </div>
                  <Rsvp event={event} size="sm" />
                </li>
              );
            })}
          </ol>
        </>
      ) : null}
      <p className="ev-note">All times are Eastern. RSVPs happen on PIN, the official GSU student organization portal.</p>
    </>
  );
}

export function PastEvents({ events }: { events: readonly ClubEvent[] }) {
  if (!events.length) return null;
  return (
    <>
      <h2 className="ev-heading">Past events</h2>
      <ol className="ev-past">
        {events.map((event) => {
          const date = dayParts(event.datetime);
          return (
            <li key={`${event.datetime}-${event.title}`} className="ev-past-item">
              {event.flyer ? (
                <div className="ev-past-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.flyer.image} alt={event.flyer.alt} width={event.flyer.width} height={event.flyer.height} loading="lazy" decoding="async" />
                </div>
              ) : null}
              <div>
                <p className="ev-past-date">
                  <time dateTime={event.datetime}>
                    {date.month} {date.day}
                  </time>
                </p>
                <h3 className="ev-past-title">{event.title}</h3>
                <p className="ev-past-detail">{event.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
