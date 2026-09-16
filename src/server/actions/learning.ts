"use server";

import { revalidatePath } from "next/cache";
import { getPath } from "@/content/loaders";
import { getViewer } from "@/server/session";
import { choosePath, saveInterviewNote, saveProjectProgress, setCertChecklist, setLessonChecks } from "@/server/services/progress";
import { prisma } from "@/server/db";

export type ActionResult<T = string> = { ok: boolean; message?: string; data?: T };

async function requireMemberForAction() {
  const viewer = await getViewer();
  if (!viewer) return { error: "Please sign in again." as const, viewer: null };
  if (!viewer.isApprovedMember && !viewer.isOfficer) return { error: "Your membership is not active yet." as const, viewer: null };
  return { error: null, viewer };
}

export async function choosePathAction(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const { error, viewer } = await requireMemberForAction();
  if (error || !viewer) return { ok: false, message: error ?? "Not allowed" };
  const pathSlug = String(formData.get("pathSlug") ?? "");
  const p = getPath(pathSlug);
  if (!p) return { ok: false, message: "Unknown path." };
  await choosePath(viewer.user.id, pathSlug, "manual");
  revalidatePath("/dashboard");
  revalidatePath(`/learn/paths/${pathSlug}`);
  return { ok: true, data: pathSlug };
}

export async function saveLessonChecksAction(contentKey: string, checks: number[], totalChecks: number): Promise<ActionResult> {
  const { error, viewer } = await requireMemberForAction();
  if (error || !viewer) return { ok: false, message: error ?? "Not allowed" };
  if (!/^(lesson|cert-lesson):[a-z0-9-]+\/[a-z0-9-]+$/.test(contentKey)) return { ok: false, message: "Invalid lesson." };
  const clean = [...new Set(checks.filter((n) => Number.isInteger(n) && n >= 0 && n < totalChecks))];
  await setLessonChecks(viewer.user.id, contentKey, clean, totalChecks);
  return { ok: true, data: clean.length >= totalChecks ? "completed" : "started" };
}

export async function saveProjectAction(
  projectSlug: string,
  data: { steps?: string[]; notes?: string | null; submissionUrl?: string | null; submissionNote?: string | null; complete?: boolean },
): Promise<ActionResult> {
  const { error, viewer } = await requireMemberForAction();
  if (error || !viewer) return { ok: false, message: error ?? "Not allowed" };
  if (!/^[a-z0-9-]+$/.test(projectSlug)) return { ok: false, message: "Invalid project." };
  if (data.submissionUrl && !/^https?:\/\/\S+$/.test(data.submissionUrl)) return { ok: false, message: "The submission link must start with http:// or https://." };
  if (data.notes && data.notes.length > 20_000) return { ok: false, message: "Notes are limited to 20,000 characters." };
  await saveProjectProgress(viewer.user.id, projectSlug, data);
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function saveCertChecklistAction(trackSlug: string, ids: string[]): Promise<ActionResult> {
  const { error, viewer } = await requireMemberForAction();
  if (error || !viewer) return { ok: false, message: error ?? "Not allowed" };
  await setCertChecklist(viewer.user.id, trackSlug, ids.filter((s) => /^[a-z0-9-]+$/.test(s)));
  return { ok: true };
}

export async function saveInterviewNoteAction(promptId: string, body: string): Promise<ActionResult> {
  const { error, viewer } = await requireMemberForAction();
  if (error || !viewer) return { ok: false, message: error ?? "Not allowed" };
  if (body.length > 10_000) return { ok: false, message: "Notes are limited to 10,000 characters." };
  await saveInterviewNote(viewer.user.id, promptId, body);
  return { ok: true };
}

export async function saveLabProfileAction(answers: Record<string, string>, environmentId: string | null, checklist: string[]): Promise<ActionResult> {
  const { error, viewer } = await requireMemberForAction();
  if (error || !viewer) return { ok: false, message: error ?? "Not allowed" };
  await prisma.labProfile.upsert({
    where: { userId: viewer.user.id },
    create: { userId: viewer.user.id, answersJson: JSON.stringify(answers), environmentId, checklistJson: JSON.stringify(checklist) },
    update: { answersJson: JSON.stringify(answers), environmentId, checklistJson: JSON.stringify(checklist) },
  });
  return { ok: true };
}
