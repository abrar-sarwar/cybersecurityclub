import "server-only";
import type { MemberProfile } from "@prisma/client";
import { prisma } from "@/server/db";
import { initialAdminEmails } from "@/server/env";
import { audit } from "@/server/audit";
import { endOfMonth } from "@/lib/dates";
import type { EducationStatus, MembershipStatus, Role } from "@/lib/enums";

/** Creates the profile row for a new auth user (idempotent). */
export async function ensureProfileForUser(userId: string, email?: string) {
  const existing = await prisma.memberProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  const bootstrapAdmin = email ? initialAdminEmails().includes(email.toLowerCase()) : false;
  const profile = await prisma.memberProfile.create({
    data: {
      userId,
      role: bootstrapAdmin ? "admin" : "member",
      membershipStatus: bootstrapAdmin ? "approved" : "pending",
      membershipDecidedAt: bootstrapAdmin ? new Date() : null,
      membershipNote: bootstrapAdmin ? "Bootstrapped from INITIAL_ADMIN_EMAILS" : null,
    },
  });
  if (bootstrapAdmin) {
    await audit(null, "role.bootstrap", { type: "user", id: userId }, `Granted administrator role from INITIAL_ADMIN_EMAILS (${email})`);
  }
  return profile;
}

/**
 * Applies time-based transitions that do not need user input:
 * - an expected graduation date in the past flips a current student to
 *   "graduation confirmation needed" (never straight to alumni).
 * - a bootstrap admin email that was added later gets promoted on next load.
 */
export async function applyAutomaticTransitions(profile: MemberProfile, email: string) {
  let next = profile;
  if (
    profile.educationStatus === "current_student" &&
    profile.expectedGraduationMonth &&
    profile.expectedGraduationYear &&
    endOfMonth(profile.expectedGraduationMonth, profile.expectedGraduationYear) < new Date()
  ) {
    next = await prisma.memberProfile.update({
      where: { id: profile.id },
      data: { educationStatus: "graduation_confirmation_needed" },
    });
  }
  if (profile.role !== "admin" && initialAdminEmails().includes(email.toLowerCase())) {
    next = await prisma.memberProfile.update({
      where: { id: profile.id },
      data: {
        role: "admin",
        membershipStatus: "approved",
        membershipDecidedAt: profile.membershipDecidedAt ?? new Date(),
        membershipNote: profile.membershipNote ?? "Bootstrapped from INITIAL_ADMIN_EMAILS",
      },
    });
    await audit(null, "role.bootstrap", { type: "user", id: profile.userId }, `Granted administrator role from INITIAL_ADMIN_EMAILS (${email})`);
  }
  return next;
}

export async function touchLastActive(profileId: string) {
  // Only write once per hour to keep the table quiet.
  const p = await prisma.memberProfile.findUnique({ where: { id: profileId }, select: { lastActiveAt: true } });
  if (!p?.lastActiveAt || Date.now() - p.lastActiveAt.getTime() > 60 * 60 * 1000) {
    await prisma.memberProfile.update({ where: { id: profileId }, data: { lastActiveAt: new Date() } });
  }
}

export async function setMembershipStatus(
  actor: { id: string; email: string },
  userId: string,
  status: MembershipStatus,
  note?: string,
) {
  const before = await prisma.memberProfile.findUnique({ where: { userId } });
  if (!before) throw new Error("Profile not found");
  const after = await prisma.memberProfile.update({
    where: { userId },
    data: {
      membershipStatus: status,
      membershipDecidedAt: new Date(),
      membershipDecidedById: actor.id,
      membershipNote: note?.trim() ? note.trim() : before.membershipNote,
    },
  });
  await audit(actor, "membership.status", { type: "user", id: userId }, `Membership changed from ${before.membershipStatus} to ${status}`, { note });
  return after;
}

export async function setRole(actor: { id: string; email: string; role: string }, userId: string, role: Role) {
  if (actor.role !== "admin") throw new Error("Only administrators can change roles");
  if (actor.id === userId && role !== "admin") throw new Error("You cannot remove your own administrator role");
  const before = await prisma.memberProfile.findUnique({ where: { userId } });
  if (!before) throw new Error("Profile not found");
  const after = await prisma.memberProfile.update({ where: { userId }, data: { role } });
  await audit(actor, "role.change", { type: "user", id: userId }, `Role changed from ${before.role} to ${role}`);
  return after;
}

export async function setEducationStatus(
  actor: { id: string; email: string } | null,
  userId: string,
  status: EducationStatus,
  extra?: { expectedGraduationMonth?: number; expectedGraduationYear?: number },
) {
  const data: Partial<MemberProfile> = { educationStatus: status };
  if (status === "confirmed_alumni") data.graduationConfirmedAt = new Date();
  if (extra?.expectedGraduationMonth) data.expectedGraduationMonth = extra.expectedGraduationMonth;
  if (extra?.expectedGraduationYear) data.expectedGraduationYear = extra.expectedGraduationYear;
  const after = await prisma.memberProfile.update({ where: { userId }, data });
  await audit(actor, "education.status", { type: "user", id: userId }, `Education status set to ${status}`, extra);
  return after;
}
