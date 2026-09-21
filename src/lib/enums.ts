/**
 * String enumerations stored in the database. Kept in one place so the Prisma
 * schema stays portable across SQLite and Postgres.
 */
export const CONTENT_STATUSES = ["draft", "published"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const EVENT_STATUSES = ["draft", "published", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const AUDIENCE_LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;
export type AudienceLevel = (typeof AUDIENCE_LEVELS)[number];

export const AUDIENCE_LABELS: Record<AudienceLevel, string> = {
  all: "All levels",
  beginner: "Beginner friendly",
  intermediate: "Some experience helpful",
  advanced: "Advanced",
};
