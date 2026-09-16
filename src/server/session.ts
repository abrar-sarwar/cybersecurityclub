import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { MemberProfile } from "@prisma/client";
import { auth } from "@/server/auth";
import { prisma } from "@/server/db";
import { applyAutomaticTransitions, ensureProfileForUser, touchLastActive } from "@/server/services/members";
import { roleAtLeast, type Role } from "@/lib/enums";

export type Viewer = {
  user: { id: string; name: string; email: string; emailVerified: boolean; image: string | null };
  profile: MemberProfile;
  session: { id: string; expiresAt: Date };
  isApprovedMember: boolean;
  isOfficer: boolean; // editor or admin
  isAdmin: boolean;
  needsGraduationConfirmation: boolean;
};

/** Current session + profile, memoised per request. Null when signed out. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  const { user, session } = result;
  let profile = await prisma.memberProfile.findUnique({ where: { userId: user.id } });
  if (!profile) profile = await ensureProfileForUser(user.id, user.email);
  profile = await applyAutomaticTransitions(profile, user.email);
  void touchLastActive(profile.id).catch(() => undefined);
  const isApprovedMember = profile.membershipStatus === "approved";
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image ?? null,
    },
    profile,
    session: { id: session.id, expiresAt: session.expiresAt },
    isApprovedMember,
    isOfficer: roleAtLeast(profile.role, "editor"),
    isAdmin: profile.role === "admin",
    needsGraduationConfirmation: profile.educationStatus === "graduation_confirmation_needed",
  };
});

function signInRedirect(next?: string): never {
  const target = next && next.startsWith("/") ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in";
  redirect(target);
}

/** Any signed-in account (approved or not). */
export async function requireUser(next?: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) signInRedirect(next);
  return viewer;
}

/** Approved club member (or officer). Pending accounts land on /pending. */
export async function requireMember(next?: string): Promise<Viewer> {
  const viewer = await requireUser(next);
  if (!viewer.isApprovedMember && !viewer.isOfficer) redirect("/pending");
  return viewer;
}

/** Officer tools. Editors and admins pass "editor"; admin-only tools pass "admin". */
export async function requireRole(min: Role, next?: string): Promise<Viewer> {
  const viewer = await requireUser(next);
  if (!roleAtLeast(viewer.profile.role, min)) redirect("/dashboard?denied=1");
  return viewer;
}

/** API variants: return null instead of redirecting so handlers can send 401/403. */
export async function apiViewer(): Promise<Viewer | null> {
  return getViewer();
}

export function actorOf(viewer: Viewer) {
  return { id: viewer.user.id, email: viewer.user.email, role: viewer.profile.role };
}
