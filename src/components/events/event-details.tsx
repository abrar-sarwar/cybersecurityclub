import { CalendarDays, Clock, MapPin, Ticket } from "lucide-react";
import Script from "next/script";
import { branding } from "@config/branding";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";
import { Badge, type Tone } from "@/components/ui/primitives";
import type { ClubEvent, EventCategory } from "@/lib/events/event";
import { formatEventDate, formatTimeRange } from "@/lib/events/format";

/**
 * The pieces every event view shares (upcoming list, calendar, archive,
 * homepage), so an event reads the same wherever it shows up. No hooks:
 * usable from server and client components alike.
 *
 * Every string here was typed by an officer on the admin page. React renders
 * it as text; nothing is ever interpreted as HTML.
 */

const CATEGORY_TONE: Record<EventCategory, Tone> = {
  Workshop: "brand",
  "General Body Meeting": "cyan",
  CTF: "danger",
  Competition: "warning",
  Social: "success",
  Speaker: "navy",
  Career: "success",
  Training: "muted",
};

/** The category's colour. A category typed outside the list (hand-edited in the table) still shows, in grey. */
export function EventCategoryBadge({ category }: { category: string | null }) {
  if (!category) return null;
  return <Badge tone={(CATEGORY_TONE as Record<string, Tone>)[category] ?? "muted"}>{category}</Badge>;
}

export function EventBadges({ event, className }: { event: ClubEvent; className?: string }) {
  const cancelled = event.status === "cancelled";
  if (!event.category && !cancelled) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className ?? ""}`} aria-label="Event type">
      {event.category ? (
        <li>
          <EventCategoryBadge category={event.category} />
        </li>
      ) : null}
      {cancelled ? (
        <li>
          <Badge tone="danger">Cancelled</Badge>
        </li>
      ) : null}
    </ul>
  );
}

export function EventFacts({ event, className }: { event: ClubEvent; className?: string }) {
  const time = formatTimeRange(event.startTime, event.endTime);
  return (
    <dl className={`ev-next-facts ${className ?? ""}`}>
      <div>
        <dt>
          <CalendarDays className="size-4" aria-hidden />
          <span className="sr-only">Date</span>
        </dt>
        <dd>
          <time dateTime={event.date}>{formatEventDate(event.date)}</time>
        </dd>
      </div>
      <div>
        <dt>
          <Clock className="size-4" aria-hidden />
          <span className="sr-only">Time</span>
        </dt>
        <dd>{time ?? "Time to be announced"}</dd>
      </div>
      <div>
        <dt>
          <MapPin className="size-4" aria-hidden />
          <span className="sr-only">Location</span>
        </dt>
        <dd>{event.location ?? "Location to be announced"}</dd>
      </div>
    </dl>
  );
}

/** Slides, repositories, recordings and labs. Renders nothing when there are none. */
export function EventMaterials({ event, className }: { event: ClubEvent; className?: string }) {
  if (!event.links.length) return null;
  return (
    <ul className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${className ?? ""}`} aria-label={`Materials for ${event.title}`}>
      {event.links.map((link) => (
        <li key={link.href}>
          <ExternalLink href={link.href}>{link.label}</ExternalLink>
        </li>
      ))}
    </ul>
  );
}

/**
 * The event's own registration link (or the club's PIN events page), plus
 * Luma's checkout when the event has one. A cancelled event has nothing to
 * register for.
 */
export function EventRegistration({ event, size = "md" }: { event: ClubEvent; size?: "sm" | "md" | "lg" }) {
  if (event.status === "cancelled") return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {event.lumaEventId ? <p className="basis-full text-sm font-semibold">Please register on both PIN and Luma.</p> : null}
      {event.lumaEventId ? (
        <>
          {/* Luma's script opens its checkout over the page; without it the link still goes to the event. */}
          <a
            href={`https://luma.com/event/${event.lumaEventId}`}
            className={buttonClasses({ size, className: "luma-checkout--button shadow-lg ring-2 ring-accent/40" })}
            data-luma-action="checkout"
            data-luma-event-id={event.lumaEventId}
          >
            <Ticket className="size-5" aria-hidden />
            Register on Luma
            <span className="sr-only">
              : {event.title}, {formatEventDate(event.date, { month: "long", day: "numeric" })}
            </span>
          </a>
          <Script id="luma-checkout" src="https://embed.lu.ma/checkout-button.js" strategy="lazyOnload" />
        </>
      ) : null}
      <ButtonLink href={event.registrationUrl ?? branding.links.pinEvents} variant={event.lumaEventId ? "outline" : "primary"} size={size} external>
        {event.registrationUrl ? (event.lumaEventId ? "Register on PIN" : "Register") : "Find it on PIN"}
        <span aria-hidden="true">↗</span>
        <span className="sr-only">
          : {event.title}, {formatEventDate(event.date, { month: "long", day: "numeric" })} (opens in a new tab)
        </span>
      </ButtonLink>
    </div>
  );
}

/**
 * The flyer, sized when its pixel size is known so the page reserves the
 * space. Flyers are either the site's own files or objects in the storage
 * bucket; the CSP allows https: images for the latter.
 */
export function EventFlyer({ event, eager, decorative, className }: { event: ClubEvent; eager?: boolean; decorative?: boolean; className?: string }) {
  if (!event.imageUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={event.imageUrl}
      alt={decorative ? "" : (event.imageAlt ?? "")}
      width={event.imageWidth ?? undefined}
      height={event.imageHeight ?? undefined}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      className={className}
    />
  );
}
