/**
 * String enumerations stored in the database. Kept in one place so the Prisma
 * schema stays portable across SQLite and Postgres.
 */
export const MEMBERSHIP_STATUSES = ["pending", "approved", "declined", "revoked"] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const EDUCATION_STATUSES = [
  "current_student",
  "graduation_confirmation_needed",
  "confirmed_alumni",
] as const;
export type EducationStatus = (typeof EDUCATION_STATUSES)[number];

export const ROLES = ["member", "editor", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const EXPERIENCE_LEVELS = ["new", "some", "experienced"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const CONTENT_STATUSES = ["draft", "published"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const EVENT_STATUSES = ["draft", "published", "cancelled"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const AUDIENCE_LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;
export type AudienceLevel = (typeof AUDIENCE_LEVELS)[number];

export const MEMBERSHIP_LABELS: Record<MembershipStatus, string> = {
  pending: "Pending approval",
  approved: "Approved member",
  declined: "Not approved",
  revoked: "Access removed",
};

export const EDUCATION_LABELS: Record<EducationStatus, string> = {
  current_student: "Current student",
  graduation_confirmation_needed: "Graduation confirmation needed",
  confirmed_alumni: "Confirmed alumni",
};

export const ROLE_LABELS: Record<Role, string> = {
  member: "Member",
  editor: "Content editor",
  admin: "Administrator",
};

export const AUDIENCE_LABELS: Record<AudienceLevel, string> = {
  all: "All levels",
  beginner: "Beginner friendly",
  intermediate: "Some experience helpful",
  advanced: "Advanced",
};

export function isRole(v: string): v is Role {
  return (ROLES as readonly string[]).includes(v);
}

export function roleAtLeast(role: string, min: Role): boolean {
  const order: Record<Role, number> = { member: 0, editor: 1, admin: 2 };
  if (!isRole(role)) return false;
  return order[role] >= order[min];
}
