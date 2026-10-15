import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { ButtonLink } from "@/components/ui/button";
import type { ClubEvent } from "@/lib/events/event";
import { eventDetail } from "@/lib/events/format";

/**
 * The events page's lists, fed from the events database. Upcoming
 * events lead: the next one is a large card with everything needed to turn
 * up, and any after it are compact rows. Past events are a strip of flyers.
 *
 * Every string here was typed by an officer. React renders it as text;
 * nothing is ever interpreted as HTML.
 */

/** Dates are plain YYYY-MM-DD days, so they are formatted in UTC to stay on that day. */
function dayParts(date: string) {
  const day = new Date(`${date}T00:00:00Z`);
  const part = (options: Intl.DateTimeFormatOptions) => day.toLocaleDateString("en-US", { timeZone: "UTC", ...options });
  return {
    weekday: part({ weekday: "long" }),
    month: part({ month: "long" }),
    monthShort: part({ month: "short" }),
    day: part({ day: "numeric" }),
  };
}

const isPin = (url: string) => /^https:\/\/([a-z0-9-]+\.)*pin\.gsu\.edu\//i.test(url);

function Rsvp({ event, size }: { event: ClubEvent; size: "sm" | "lg" }) {
  if (event.status === "cancelled") return null;
  const url = event.registrationUrl ?? branding.links.pinEvents;
  const label = event.registrationUrl ? (isPin(url) ? "RSVP on PIN" : "Register") : "Find it on PIN";
  return (
    <ButtonLink href={url} size={size} external>
      {label}
      <ArrowUpRight className="size-4" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </ButtonLink>
  );
}

/** Plain text from the sheet with its line breaks kept (see .ev-next-summary). */
export function EventDescription({ text }: { text: string }) {
  return <p className="ev-next-summary">{text}</p>;
}

function Flyer({ event, eager }: { event: ClubEvent; eager?: boolean }) {
  if (!event.imageUrl) return null;
  // Remote images are plain <img>: officers paste URLs from any host, and the CSP allows https: images.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={event.imageUrl} alt={event.imageAlt ?? ""} loading={eager ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" />;
}

function NextEvent({ event, today }: { event: ClubEvent; today: string }) {
  const date = dayParts(event.date);
  const detail = eventDetail(event);
  const cancelled = event.status === "cancelled";
  return (
    <article className="ev-next" data-flyer={event.imageUrl ? "" : undefined}>
      {event.imageUrl ? (
        <div className="ev-next-flyer">
          <Flyer event={event} eager />
        </div>
      ) : null}
      <div className="ev-next-body">
        <p className="ev-flag" data-cancelled={cancelled ? "" : undefined}>
          <span className="ev-flag-pulse" aria-hidden="true" />
          {cancelled ? "Cancelled" : event.date === today ? "Happening today" : "Next up"}
        </p>
        <h2 className="ev-next-title">{event.title}</h2>
        <dl className="ev-next-facts">
          <div>
            <dt>
              <CalendarDays className="size-4" aria-hidden />
              <span className="sr-only">When</span>
            </dt>
            <dd>
              <time dateTime={event.date}>
                {date.weekday}, {date.month} {date.day}
              </time>
            </dd>
          </div>
          {detail ? (
            <div>
              <dt>
                <MapPin className="size-4" aria-hidden />
                <span className="sr-only">Where and what time</span>
              </dt>
              <dd>{detail}</dd>
            </div>
          ) : null}
        </dl>
        {event.description ? <EventDescription text={event.description} /> : null}
        {cancelled ? <p className="ev-cancelled-note">This event has been cancelled. Watch Discord for what replaces it.</p> : null}
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
              const date = dayParts(event.date);
              const detail = eventDetail(event);
              const cancelled = event.status === "cancelled";
              return (
                <li key={event.id} className="ev-row" data-cancelled={cancelled ? "" : undefined}>
                  <time className="ev-row-date" dateTime={event.date}>
                    <span>{date.monthShort}</span>
                    <b>{date.day}</b>
                  </time>
                  <div className="ev-row-body">
                    <h3 className="ev-row-title">{event.title}</h3>
                    <p className="ev-row-detail">
                      {cancelled ? "Cancelled · " : ""}
                      {date.weekday}
                      {detail ? ` · ${detail}` : ""}
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
          const date = dayParts(event.date);
          const detail = eventDetail(event);
          return (
            <li key={event.id} className="ev-past-item">
              {event.imageUrl ? (
                <div className="ev-past-thumb">
                  <Flyer event={event} />
                </div>
              ) : null}
              <div>
                <p className="ev-past-date">
                  <time dateTime={event.date}>
                    {date.month} {date.day}
                  </time>
                </p>
                <h3 className="ev-past-title">{event.title}</h3>
                {detail ? <p className="ev-past-detail">{detail}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** Shown when the sheet could not be read and nothing good is cached. Never pretends the calendar is empty. */
export function EventsUnavailable() {
  return (
    <div className="signal-empty" role="status">
      <span className="signal-empty-icon" aria-hidden="true">
        <CalendarDays className="size-5" />
      </span>
      <div>
        <h2 className="ev-empty-title">The events list is not available right now</h2>
        <p className="ev-empty-text">We could not load the calendar. Upcoming events are also listed on PIN and announced in Discord.</p>
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

export function EventsLoading() {
  return (
    <p className="ev-loading" role="status" aria-live="polite">
      Loading events…
    </p>
  );
}
