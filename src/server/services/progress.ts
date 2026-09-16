import "server-only";
import { prisma } from "@/server/db";
import { audit } from "@/server/audit";

export async function getActivePathSelection(userId: string) {
  return prisma.pathSelection.findFirst({ where: { userId, active: true }, orderBy: { selectedAt: "desc" } });
}

export async function listPathHistory(userId: string) {
  return prisma.pathSelection.findMany({ where: { userId }, orderBy: { selectedAt: "desc" } });
}

/** Switches the active path. Prior selections and all progress are kept. */
export async function choosePath(userId: string, pathSlug: string, source: "manual" | "questionnaire") {
  const current = await getActivePathSelection(userId);
  if (current?.pathSlug === pathSlug) return current;
  await prisma.$transaction([
    prisma.pathSelection.updateMany({ where: { userId, active: true }, data: { active: false, endedAt: new Date() } }),
    prisma.pathSelection.create({ data: { userId, pathSlug, source, active: true } }),
  ]);
  await audit({ id: userId, email: "" }, "path.choose", { type: "user", id: userId }, `Chose path ${pathSlug} (${source})`);
  return getActivePathSelection(userId);
}

export async function getLessonProgressMap(userId: string, keyPrefix?: string) {
  const rows = await prisma.lessonProgress.findMany({ where: { userId, ...(keyPrefix ? { contentKey: { startsWith: keyPrefix } } : {}) } });
  return new Map(rows.map((r) => [r.contentKey, r]));
}

export async function markLessonStarted(userId: string, contentKey: string) {
  return prisma.lessonProgress.upsert({
    where: { userId_contentKey: { userId, contentKey } },
    create: { userId, contentKey, status: "started" },
    update: {},
  });
}

export async function setLessonChecks(userId: string, contentKey: string, checks: number[], totalChecks: number) {
  const complete = totalChecks > 0 && checks.length >= totalChecks;
  return prisma.lessonProgress.upsert({
    where: { userId_contentKey: { userId, contentKey } },
    create: { userId, contentKey, status: complete ? "completed" : "started", checksJson: JSON.stringify(checks), completedAt: complete ? new Date() : null },
    update: { status: complete ? "completed" : "started", checksJson: JSON.stringify(checks), completedAt: complete ? new Date() : null },
  });
}

export async function getProjectProgress(userId: string, projectSlug: string) {
  return prisma.projectProgress.findUnique({ where: { userId_projectSlug: { userId, projectSlug } } });
}

export async function listProjectProgress(userId: string) {
  return prisma.projectProgress.findMany({ where: { userId }, orderBy: { updatedAt: "desc" } });
}

export async function saveProjectProgress(
  userId: string,
  projectSlug: string,
  data: { steps?: string[]; notes?: string | null; submissionUrl?: string | null; submissionNote?: string | null; complete?: boolean },
) {
  const existing = await getProjectProgress(userId, projectSlug);
  const stepsJson = data.steps ? JSON.stringify(data.steps) : (existing?.stepsJson ?? "[]");
  const status = data.complete === undefined ? (existing?.status ?? "in_progress") : data.complete ? "completed" : "in_progress";
  return prisma.projectProgress.upsert({
    where: { userId_projectSlug: { userId, projectSlug } },
    create: {
      userId,
      projectSlug,
      status,
      stepsJson,
      notes: data.notes ?? null,
      submissionUrl: data.submissionUrl ?? null,
      submissionNote: data.submissionNote ?? null,
      completedAt: status === "completed" ? new Date() : null,
    },
    update: {
      status,
      stepsJson,
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.submissionUrl !== undefined ? { submissionUrl: data.submissionUrl } : {}),
      ...(data.submissionNote !== undefined ? { submissionNote: data.submissionNote } : {}),
      completedAt: status === "completed" ? (existing?.completedAt ?? new Date()) : null,
    },
  });
}

export async function getCertProgress(userId: string, trackSlug: string) {
  return prisma.certProgress.findUnique({ where: { userId_trackSlug: { userId, trackSlug } } });
}

export async function setCertChecklist(userId: string, trackSlug: string, ids: string[]) {
  return prisma.certProgress.upsert({
    where: { userId_trackSlug: { userId, trackSlug } },
    create: { userId, trackSlug, checklistJson: JSON.stringify(ids) },
    update: { checklistJson: JSON.stringify(ids) },
  });
}

export async function recordPracticeAttempt(userId: string, trackSlug: string, questionId: string, selected: string[], correct: boolean) {
  return prisma.practiceAttempt.create({ data: { userId, trackSlug, questionId, selectedJson: JSON.stringify(selected), correct } });
}

export async function practiceSummary(userId: string, trackSlug: string) {
  const attempts = await prisma.practiceAttempt.findMany({ where: { userId, trackSlug }, orderBy: { createdAt: "desc" } });
  const latestByQuestion = new Map<string, boolean>();
  for (const a of attempts) if (!latestByQuestion.has(a.questionId)) latestByQuestion.set(a.questionId, a.correct);
  const answered = latestByQuestion.size;
  const correct = [...latestByQuestion.values()].filter(Boolean).length;
  return { attempts: attempts.length, answered, correct, latestByQuestion };
}

export async function getInterviewNotes(userId: string) {
  const rows = await prisma.interviewNote.findMany({ where: { userId } });
  return new Map(rows.map((r) => [r.promptId, r.body]));
}

export async function saveInterviewNote(userId: string, promptId: string, body: string) {
  if (!body.trim()) {
    await prisma.interviewNote.deleteMany({ where: { userId, promptId } });
    return null;
  }
  return prisma.interviewNote.upsert({
    where: { userId_promptId: { userId, promptId } },
    create: { userId, promptId, body },
    update: { body },
  });
}
