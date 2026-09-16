import type { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type MemberRole = Database["public"]["Enums"]["member_role"];
export type MembershipStatus = Database["public"]["Enums"]["membership_status"];
export type ActivityType = Database["public"]["Enums"]["activity_type"];
export type PortalEvent = Database["public"]["Tables"]["events"]["Row"];

export const STUDENT_EMAIL_DOMAIN = "student.gsu.edu";

export const INTERESTS = [
  { value: "osint", label: "OSINT" },
  { value: "defensive_security", label: "Defensive security" },
  { value: "ethical_hacking", label: "Ethical hacking" },
  { value: "ctfs", label: "CTFs" },
  { value: "cloud_security", label: "Cloud security" },
  { value: "forensics", label: "Forensics" },
] as const;

export type Interest = (typeof INTERESTS)[number]["value"];
export const INTEREST_VALUES = INTERESTS.map((interest) => interest.value) as [Interest, ...Interest[]];

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export const MEMBER_ROLES = ["member", "officer", "admin"] as const satisfies readonly MemberRole[];
export const MEMBERSHIP_STATUSES = ["active", "suspended"] as const satisfies readonly MembershipStatus[];

export const ROLE_LABELS: Record<MemberRole, string> = {
  member: "Member",
  officer: "Officer",
  admin: "Admin",
};

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  suspended: "Suspended",
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  workshop_attended: "Workshop attended",
  challenge_completed: "Challenge completed",
};

/** Expected graduation years offered in forms: this year through six years out. */
export function graduationYearOptions(now = new Date()) {
  const year = now.getFullYear();
  return Array.from({ length: 7 }, (_, index) => year + index);
}

/** Onboarding is complete once the required fields are set. */
export function isProfileComplete(profile: Pick<Profile, "full_name" | "student_email" | "grad_month" | "grad_year">) {
  return Boolean(profile.full_name && profile.student_email && profile.grad_month && profile.grad_year);
}

export function roleAtLeast(role: MemberRole, min: MemberRole) {
  return MEMBER_ROLES.indexOf(role) >= MEMBER_ROLES.indexOf(min);
}

/**
 * Accepts only same-site relative paths for post-sign-in redirects. Rejects
 * absolute URLs, protocol-relative "//host" and backslash tricks.
 */
export function safeNextPath(value: unknown, fallback = "/dashboard") {
  if (typeof value !== "string" || value.length > 512) return fallback;
  if (!value.startsWith("/") || /[\\\u0000-\u001f]/.test(value)) return fallback;
  try {
    const parsed = new URL(value, "http://portal.local");
    const path = `${parsed.pathname}${parsed.search}`;
    // Check the normalized result too: "/.//evil.com" normalizes to "//evil.com".
    if (parsed.origin !== "http://portal.local" || !path.startsWith("/") || path.startsWith("//")) return fallback;
    return path;
  } catch {
    return fallback;
  }
}

/** An event is upcoming until it ends (or starts, when it has no end time). */
export function isEventUpcoming(event: Pick<PortalEvent, "starts_at" | "ends_at">, now = new Date()) {
  return new Date(event.ends_at ?? event.starts_at).getTime() >= now.getTime();
}

export function formatGraduation(profile: Pick<Profile, "grad_month" | "grad_year">) {
  if (!profile.grad_month || !profile.grad_year) return null;
  return `${MONTHS[profile.grad_month - 1]} ${profile.grad_year}`;
}
