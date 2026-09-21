import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  certTrackSchema,
  guideFrontmatterSchema,
  interviewContentSchema,
  labGuideSchema,
  lessonFrontmatterSchema,
  pathSchema,
  practiceQuestionsSchema,
  projectSchema,
  type CertTrack,
  type InterviewContent,
  type LabGuide,
  type LearningPath,
  type Lesson,
  type LessonFrontmatter,
  type PracticeQuestion,
  type Project,
} from "./schemas";

export const CONTENT_ROOT = path.join(process.cwd(), "content");

const isDev = process.env.NODE_ENV === "development";
const cache = new Map<string, unknown>();

function cached<T>(key: string, produce: () => T): T {
  if (!isDev && cache.has(key)) return cache.get(key) as T;
  const value = produce();
  cache.set(key, value);
  return value;
}

export class ContentError extends Error {
  constructor(
    public file: string,
    message: string,
  ) {
    super(`${file}: ${message}`);
    this.name = "ContentError";
  }
}

function readJson(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    throw new ContentError(path.relative(CONTENT_ROOT, file), (err as Error).message);
  }
}

function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function listFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .sort();
}

function parseWith<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: { path: PropertyKey[]; message: string }[] } } }, value: unknown, file: string): T {
  const r = schema.safeParse(value);
  if (!r.success || r.data === undefined) {
    const issues = (r.error?.issues ?? []).map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ");
    throw new ContentError(path.relative(CONTENT_ROOT, file), issues || "invalid");
  }
  return r.data;
}

function readMarkdown<T>(file: string, schema: Parameters<typeof parseWith<T>>[0]): { data: T; body: string } {
  const raw = fs.readFileSync(file, "utf8");
  const parsed = matter(raw);
  const data = parseWith<T>(schema, parsed.data, file);
  return { data, body: parsed.content.trim() };
}

// ---------------------------------------------------------------------------
// Learning paths
// ---------------------------------------------------------------------------

export function loadPaths(): LearningPath[] {
  return cached("paths", () => {
    const root = path.join(CONTENT_ROOT, "paths");
    return listDirs(root).map((dir) => {
      const file = path.join(root, dir, "path.json");
      const p = parseWith<LearningPath>(pathSchema, readJson(file), file);
      if (p.slug !== dir) throw new ContentError(`paths/${dir}/path.json`, `slug "${p.slug}" must match folder name`);
      return p;
    });
  });
}

export function getPath(slug: string): LearningPath | null {
  return loadPaths().find((p) => p.slug === slug) ?? null;
}

export function loadLessonsForPath(pathSlug: string): Lesson[] {
  return cached(`lessons:${pathSlug}`, () => {
    const dir = path.join(CONTENT_ROOT, "paths", pathSlug, "lessons");
    return listFiles(dir, ".md").map((f) => {
      const file = path.join(dir, f);
      const slug = f.replace(/\.md$/, "");
      const { data, body } = readMarkdown<LessonFrontmatter>(file, lessonFrontmatterSchema);
      return { ...data, slug, body, contentKey: `lesson:${pathSlug}/${slug}` };
    });
  });
}

export function getLesson(pathSlug: string, lessonSlug: string): Lesson | null {
  return loadLessonsForPath(pathSlug).find((l) => l.slug === lessonSlug) ?? null;
}

/** Ordered lesson keys for a path (module order, then lesson order). */
export function orderedLessonSlugs(p: LearningPath): { moduleSlug: string; lessonSlug: string }[] {
  return p.modules.flatMap((m) => m.lessons.map((lessonSlug) => ({ moduleSlug: m.slug, lessonSlug })));
}

export function findModuleForLesson(p: LearningPath, lessonSlug: string) {
  return p.modules.find((m) => m.lessons.includes(lessonSlug)) ?? null;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export function loadProjects(): Project[] {
  return cached("projects", () => {
    const dir = path.join(CONTENT_ROOT, "projects");
    return listFiles(dir, ".json").map((f) => {
      const file = path.join(dir, f);
      const p = parseWith<Project>(projectSchema, readJson(file), file);
      if (`${p.slug}.json` !== f) throw new ContentError(`projects/${f}`, `slug "${p.slug}" must match file name`);
      return p;
    });
  });
}

export function getProject(slug: string): Project | null {
  return loadProjects().find((p) => p.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Certification tracks
// ---------------------------------------------------------------------------

export function loadCertTracks(): CertTrack[] {
  return cached("certs", () => {
    const root = path.join(CONTENT_ROOT, "certifications");
    return listDirs(root).map((dir) => {
      const file = path.join(root, dir, "track.json");
      const t = parseWith<CertTrack>(certTrackSchema, readJson(file), file);
      if (t.slug !== dir) throw new ContentError(`certifications/${dir}/track.json`, `slug must match folder`);
      return t;
    });
  });
}

export function getCertTrack(slug: string): CertTrack | null {
  return loadCertTracks().find((t) => t.slug === slug) ?? null;
}

export function loadCertLessons(trackSlug: string): Lesson[] {
  return cached(`cert-lessons:${trackSlug}`, () => {
    const dir = path.join(CONTENT_ROOT, "certifications", trackSlug, "lessons");
    return listFiles(dir, ".md").map((f) => {
      const file = path.join(dir, f);
      const slug = f.replace(/\.md$/, "");
      const { data, body } = readMarkdown<LessonFrontmatter>(file, lessonFrontmatterSchema);
      return { ...data, slug, body, contentKey: `cert-lesson:${trackSlug}/${slug}` };
    });
  });
}

export function getCertLesson(trackSlug: string, lessonSlug: string): Lesson | null {
  return loadCertLessons(trackSlug).find((l) => l.slug === lessonSlug) ?? null;
}

export function loadPracticeQuestions(trackSlug: string): PracticeQuestion[] {
  return cached(`questions:${trackSlug}`, () => {
    const file = path.join(CONTENT_ROOT, "certifications", trackSlug, "questions.json");
    if (!fs.existsSync(file)) return [];
    return parseWith<PracticeQuestion[]>(practiceQuestionsSchema, readJson(file), file);
  });
}

// ---------------------------------------------------------------------------
// Interview preparation
// ---------------------------------------------------------------------------

export function loadInterviewContent(): InterviewContent {
  return cached("interview", () => {
    const file = path.join(CONTENT_ROOT, "interview", "topics.json");
    return parseWith<InterviewContent>(interviewContentSchema, readJson(file), file);
  });
}

export type Guide = { slug: string; title: string; summary: string; lastReviewed: string; references: { title: string; url: string; note?: string }[]; body: string };

export function loadInterviewGuide(slug: string): Guide | null {
  const file = path.join(CONTENT_ROOT, "interview", "guides", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, body } = readMarkdown<Omit<Guide, "slug" | "body">>(file, guideFrontmatterSchema);
  return { ...data, slug, body };
}

// ---------------------------------------------------------------------------
// Home lab
// ---------------------------------------------------------------------------

export function loadLabGuide(): LabGuide {
  return cached("lab", () => {
    const file = path.join(CONTENT_ROOT, "lab", "lab-guide.json");
    return parseWith<LabGuide>(labGuideSchema, readJson(file), file);
  });
}

export function loadLabEnvironmentGuide(guideSlug: string): Guide | null {
  const file = path.join(CONTENT_ROOT, "lab", "environments", `${guideSlug}.md`);
  if (!fs.existsSync(file)) return null;
  const { data, body } = readMarkdown<Omit<Guide, "slug" | "body">>(file, guideFrontmatterSchema);
  return { ...data, slug: guideSlug, body };
}
