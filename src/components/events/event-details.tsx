import { CalendarDays, Clock, MapPin } from "lucide-react";
import { branding } from "@config/branding";
import { ButtonLink } from "@/components/ui/button";
import { ExternalLink } from "@/components/ui/external-link";
import { Badge } from "@/components/ui/primitives";
import { formatEventDate, formatEventTime, type ClubEvent, type EventDifficulty } from "@/content/club/events";

/**
 * The pieces every event view shares (upcoming list, calendar, archive), so
 * an event reads the same wherever it shows up. No hooks: usable from server
 * and client components alike.
 */

const DIFFICULTY: Record<EventDifficulty, { label: string; tone: "success" | "warning" | "danger" }> = {
  Beginner: { label: "Beginner friendly", tone: "success" },
  "All Levels": { label: "All levels welcome", tone: "success" },
  Intermediate: { label: "Intermediate", tone: "warning" },
  Advanced: { label: "Advanced", tone: "danger" },
};

export function EventBadges({ event, className }: { event: ClubEvent; className?: string }) {
  const level = event.difficulty ? DIFFICULTY[event.difficulty] : null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className ?? ""}`} aria-label="Event type and level">
      <li>
        <Badge>{event.category}</Badge>
      </li>
      {level ? (
        <li>
          <Badge tone={level.tone}>{level.label}</Badge>
        </li>
      ) : null}
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

/** The event's own registration link, or the club's PIN events page when it has none. */
export function EventRegistration({ event, size = "md" }: { event: ClubEvent; size?: "sm" | "md" | "lg" }) {
  return (
    <ButtonLink href={event.registrationUrl ?? branding.links.pinEvents} size={size} external>
      {event.registrationUrl ? "Register" : "Find it on PIN"}
      <span aria-hidden="true">↗</span>
      <span className="sr-only">
        : {event.title}, {formatEventDate(event.date, { month: "long", day: "numeric" })} (opens in a new tab)
      </span>
    </ButtonLink>
  );
}
