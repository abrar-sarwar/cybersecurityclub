import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { isProfileComplete, roleAtLeast, type MemberRole, type Profile } from "@/lib/portal";
import { SupabaseNotConfiguredError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type Viewer = {
  id: string;
  /** Sign-in address (usually a personal Google account). */
  email: string | null;
  profile: Profile;
  isComplete: boolean;
  /** Student email verified and membership active: student-only features unlock. */
  isVerified: boolean;
  isSuspended: boolean;
  isOfficer: boolean;
  isAdmin: boolean;
};

let warnedNotConfigured = false;

/**
 * The signed-in member, memoised per request. Null when signed out.
 * The JWT is verified with getClaims(); the profile is read through row
 * level security as that member.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await createClient();
  } catch (error) {
    if (!(error instanceof SupabaseNotConfiguredError)) throw error;
    if (!warnedNotConfigured) {
      console.warn("[session] Supabase is not configured; everyone is treated as signed out.");
      warnedNotConfigured = true;
    }
    return null;
  }

  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile) return null;

  const active = profile.membership_status === "active";
  return {
    id: userId,
    email: typeof data?.claims.email === "string" ? data.claims.email : null,
    profile,
    isComplete: isProfileComplete(profile),
    isVerified: active && Boolean(profile.student_email_verified_at),
    isSuspended: !active,
    isOfficer: active && roleAtLeast(profile.role, "officer"),
    isAdmin: active && profile.role === "admin",
  };
});

function joinRedirect(next: string): never {
  redirect(`/join?next=${encodeURIComponent(next)}`);
}

/** Any signed-in account. */
export async function requireUser(next: string) {
  const viewer = await getViewer();
  if (!viewer) joinRedirect(next);
  return viewer;
}

/** Signed in with a finished onboarding form. */
export async function requireMember(next: string) {
  const viewer = await requireUser(next);
  if (!viewer.isComplete) redirect("/onboarding");
  return viewer;
}

/**
 * Staff pages. Members get a plain 404 so the admin area does not advertise
 * itself. Call this in every admin page; layouts alone do not protect
 * server actions or direct requests.
 */
export async function requireStaff(min: Extract<MemberRole, "officer" | "admin">, next: string) {
  const viewer = await requireUser(next);
  const allowed = min === "admin" ? viewer.isAdmin : viewer.isOfficer;
  if (!allowed) notFound();
  return viewer;
}

/** Server action guard: returns the viewer or null, never redirects. */
export async function staffForAction(min: Extract<MemberRole, "officer" | "admin">) {
  const viewer = await getViewer();
  if (!viewer) return null;
  return (min === "admin" ? viewer.isAdmin : viewer.isOfficer) ? viewer : null;
}
