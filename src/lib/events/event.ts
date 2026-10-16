/**
 * One club event as the public pages render it. Built from a table row (or
 * the admin form's cells) by `parseSheet`; nothing here is stored as-is.
 */
export type EventStatus = "upcoming" | "completed" | "cancelled";

/** The kinds of event the site colour-codes. The admin form offers exactly these. */
export const EVENT_CATEGORIES = ["Workshop", "General Body Meeting", "CTF", "Competition", "Social", "Speaker", "Career", "Training"] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "All Levels"] as const;
export type EventDifficulty = (typeof EVENT_DIFFICULTIES)[number];

/** Slides, a repository, a recording or a lab shared for an event, usually afterwards. */
export type EventLink = { label: string; href: string };

export type ClubEvent = {
  /** The table's `id`, unique across rows. */
  id: string;
  title: string;
  /** Plain text with line breaks preserved, or null. */
  description: string | null;
  /** Free text in the store; one of EVENT_CATEGORIES when it came through the admin form. */
  category: string | null;
  /** Optional: not every event has a level. */
  difficulty: EventDifficulty | null;
  /** The day it happens, YYYY-MM-DD in the club's timezone. */
  date: string;
  /** Wall clock HH:mm in the club's timezone, or null when none was given. */
  startTime: string | null;
  endTime: string | null;
  /** ISO instants derived from date and times; the phase split uses these. */
  startsAt: string;
  endsAt: string;
  location: string | null;
  /** An https URL or a site path such as /assets/events/flyer.webp. */
  imageUrl: string | null;
  imageAlt: string | null;
  /** Pixel size of the flyer when known, so the page reserves its space before it loads. */
  imageWidth: number | null;
  imageHeight: number | null;
  registrationUrl: string | null;
  /** Luma event id (`evt-…`). Adds a Luma checkout button next to the PIN one. */
  lumaEventId: string | null;
  links: EventLink[];
  status: EventStatus;
  /** False only when parsed with `includeUnpublished`; public pages never see false. */
  published: boolean;
};
