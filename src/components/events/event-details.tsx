import { CalendarDays, Clock, MapPin } from "lucide-react";
import Script from "next/script";
import type { ReactNode } from "react";
import { branding } from "@config/branding";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";
import { Badge, type Tone } from "@/components/ui/primitives";
import { formatEventDate, formatEventTime, type ClubEvent, type EventCategory } from "@/content/club/events";

/**
 * The pieces every event view shares (upcoming list, calendar, archive), so
 * an event reads the same wherever it shows up. No hooks: usable from server
 * and client components alike.
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

export function EventCategoryBadge({ category }: { category: EventCategory }) {
  return <Badge tone={CATEGORY_TONE[category]}>{category}</Badge>;
}

export function EventBadges({ event, className }: { event: ClubEvent; className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className ?? ""}`} aria-label="Event type">
      <li>
        <EventCategoryBadge category={event.category} />
      </li>
    </ul>
  );
}

export function EventFacts({ event, className }: { event: ClubEvent; className?: string }) {
  const time = formatEventTime(event);
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
  if (!event.links?.length) return null;
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

/** The event's own registration link (or the club's PIN events page), plus Luma's checkout when the event has one. */
export function EventRegistration({ event, size = "md" }: { event: ClubEvent; size?: "sm" | "md" | "lg" }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {event.lumaEventId ? <p className="basis-full text-sm font-semibold">Please register on both PIN and Luma.</p> : null}
      <ButtonLink href={event.registrationUrl ?? branding.links.pinEvents} size={size} external>
        {event.registrationUrl ? (event.lumaEventId ? "Register on PIN" : "Register") : "Find it on PIN"}
        <span aria-hidden="true">↗</span>
        <span className="sr-only">
          : {event.title}, {formatEventDate(event.date, { month: "long", day: "numeric" })} (opens in a new tab)
        </span>
      </ButtonLink>
      {event.lumaEventId ? (
        <>
          {/* Luma's script opens its checkout over the page; without it the link still goes to the event. */}
          <a
            href={`https://luma.com/event/${event.lumaEventId}`}
            className={buttonClasses({ variant: "outline", size, className: "luma-checkout--button" })}
            data-luma-action="checkout"
            data-luma-event-id={event.lumaEventId}
          >
            Register on Luma
            <span className="sr-only">
              : {event.title}, {formatEventDate(event.date, { month: "long", day: "numeric" })}
            </span>
          </a>
          <Script id="luma-checkout" src="https://embed.lu.ma/checkout-button.js" strategy="lazyOnload" />
        </>
      ) : null}
    </div>
  );
}

/** Pads a grid or list with "TBD" cards so a short list never leaves visible gaps. */
export function TbdSlots({ count, as: Tag = "li", className }: { count: number; as?: "li" | "div"; className?: string }): ReactNode {
  return Array.from({ length: Math.max(0, count) }, (_, i) => (
    <Tag key={`tbd-${i}`} className={`card flex min-h-32 items-center justify-center border-dashed p-5 text-center text-muted ${className ?? ""}`}>
      <p className="font-display text-lg font-semibold">TBD, stay tuned!</p>
    </Tag>
  ));
}
