/**
 * One published club event as the public pages render it. Built from a sheet
 * row by `parseSheet`; nothing here is stored anywhere.
 */
export type EventStatus = "upcoming" | "completed" | "cancelled";

export type ClubEvent = {
  /** The sheet's `event_id`, unique across published rows. */
  id: string;
  title: string;
  /** Plain text with line breaks preserved, or null. */
  description: string | null;
  category: string | null;
  /** The day it happens, YYYY-MM-DD in the club's timezone. */
  date: string;
  /** Wall clock HH:mm in the club's timezone, or null when the sheet gives none. */
  startTime: string | null;
  endTime: string | null;
  /** ISO instants derived from date and times; the phase split uses these. */
  startsAt: string;
  endsAt: string;
  location: string | null;
  /** An https URL or a site path such as /assets/events/flyer.webp. */
  imageUrl: string | null;
  imageAlt: string | null;
  registrationUrl: string | null;
  status: EventStatus;
  /** False only when parsed with `includeUnpublished`; public pages never see false. */
  published: boolean;
};
