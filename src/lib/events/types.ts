/**
 * Event domain types shared by the public site, the admin dashboard and the
 * server. Rows mirror `public.events`; view models are what components render.
 */

export const EVENT_CATEGORIES = ["workshop", "speaker", "career", "competition", "general_meeting", "other"] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  workshop: "Workshop",
  speaker: "Speaker",
  career: "Career",
  competition: "Competition",
  general_meeting: "General meeting",
  other: "Event",
};

export const EVENT_STATUSES = ["draft", "published", "canceled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Draft",
  published: "Published",
  canceled: "Canceled",
};

/** A row of `public.events` exactly as the Data API returns it. */
export type EventRow = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  location: string;
  directions_url: string | null;
  registration_url: string | null;
  flyer_path: string | null;
  flyer_alt: string | null;
  flyer_width: number | null;
  flyer_height: number | null;
  recap: string | null;
  slides_url: string | null;
  recording_url: string | null;
  materials_url: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  deleted_by: string | null;
  legacy_key: string | null;
};

export type EventFlyer = { url: string; alt: string; width: number; height: number };

/** What the public pages render. Drafts never become a PublicEvent. */
export type PublicEvent = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  status: "published" | "canceled";
  /** ISO instants. Display converts them to the club timezone. */
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location: string;
  directionsUrl: string | null;
  registrationUrl: string | null;
  flyer: EventFlyer | null;
  recap: string | null;
  slidesUrl: string | null;
  recordingUrl: string | null;
  materialsUrl: string | null;
};

/** What the dashboard renders: every status, plus bookkeeping columns. */
export type AdminEvent = Omit<PublicEvent, "status"> & {
  status: EventStatus;
  version: number;
  flyerPath: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  deletedAt: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};
