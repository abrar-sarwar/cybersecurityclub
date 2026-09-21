import { z } from "zod";

/**
 * Zod schemas for every structured content file under /content.
 * The content-check script validates all files against these schemas, and the
 * loaders in src/content/loaders.ts parse with them at runtime.
 */

export const DIAGRAM_IDS = [
  "alert-lifecycle",
  "incident-response-phases",
  "cia-triad",
  "network-layers",
  "auth-vs-authz",
  "rbac-matrix",
  "identity-lifecycle",
  "sdlc-security",
  "http-request-cycle",
  "threat-model-dfd",
  "home-network-segments",
  "log-pipeline",
  "defense-in-depth",
] as const;
export type DiagramId = (typeof DIAGRAM_IDS)[number];

export const PATH_SLUGS = [
  "security-operations",
  "identity-access-management",
  "product-application-security",
  "penetration-testing",
  "cloud-security",
  "digital-forensics",
  "threat-intelligence",
  "governance-risk-compliance",
  "incident-response",
] as const;
export type PathSlug = (typeof PATH_SLUGS)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase-kebab-case");
const statusSchema = z.enum(["draft", "published"]).default("published");

export const referenceSchema = z.object({
  title: z.string().min(2),
  url: z.string().url(),
  note: z.string().optional(),
});
export type Reference = z.infer<typeof referenceSchema>;

// ---------------------------------------------------------------------------
// Learning paths
// ---------------------------------------------------------------------------

export const pathModuleSchema = z.object({
  slug,
  title: z.string().min(2),
  summary: z.string().min(10),
  lessons: z.array(slug).min(1),
});

export const pathSchema = z.object({
  slug: z.enum(PATH_SLUGS),
  title: z.string().min(2),
  shortTitle: z.string().min(2),
  tagline: z.string().min(10).max(140),
  summary: z.string().min(40),
  availability: z.enum(["complete", "overview"]),
  icon: z.enum([
    "Radar",
    "ShieldCheck",
    "KeyRound",
    "Code2",
    "Crosshair",
    "Cloud",
    "Search",
    "Globe",
    "Scale",
    "Siren",
  ]),
  roleOverview: z.string().min(80),
  typicalTasks: z.array(z.string().min(5)).min(3),
  prerequisites: z.array(z.string().min(3)).min(1),
  goodFitIf: z.array(z.string().min(5)).min(2),
  startingSkills: z.array(z.string().min(3)).min(2),
  buildNext: z.array(z.string().min(3)).min(2),
  modules: z.array(pathModuleSchema).default([]),
  portfolioProject: slug.optional(),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        url: z.string().url(),
        note: z.string().optional(),
      }),
    )
    .default([]),
  interviewTopics: z.array(slug).default([]),
  learningRoutine: z.array(z.string().min(5)).default([]),
  support: z
    .array(
      z.object({
        label: z.string(),
        kind: z.enum(["discord", "event", "link"]),
        href: z.string().optional(),
      }),
    )
    .default([]),
  status: statusSchema,
  lastReviewed: isoDate,
  sources: z.array(referenceSchema).default([]),
});
export type LearningPath = z.infer<typeof pathSchema>;

export const lessonFrontmatterSchema = z.object({
  title: z.string().min(3),
  objective: z.string().min(10),
  kind: z.enum(["lesson", "exercise"]).default("lesson"),
  estimatedMinutes: z.number().int().min(5).max(240),
  prerequisites: z.array(z.string()).default([]),
  diagram: z.enum(DIAGRAM_IDS).optional(),
  completionChecks: z.array(z.string().min(5)).min(1),
  references: z.array(referenceSchema).default([]),
  status: statusSchema,
  lastReviewed: isoDate,
});
export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;

export type Lesson = LessonFrontmatter & {
  slug: string;
  body: string;
  contentKey: string;
};

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export const projectSchema = z.object({
  slug,
  title: z.string().min(3),
  objective: z.string().min(20),
  summary: z.string().min(30),
  targetSkills: z.array(z.string().min(3)).min(2),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedHours: z.number().min(1).max(80),
  environment: z.array(z.string().min(3)).min(1),
  relatedPaths: z.array(z.enum(PATH_SLUGS)).min(1),
  safety: z.array(z.string().min(5)).default([]),
  steps: z
    .array(
      z.object({
        id: slug,
        title: z.string().min(3),
        body: z.string().min(20),
        hint: z.string().optional(),
      }),
    )
    .min(3),
  completionCriteria: z.array(z.string().min(5)).min(2),
  deliverable: z.string().min(20),
  reflectionQuestions: z.array(z.string().min(10)).min(2),
  interviewTopics: z.array(slug).default([]),
  resources: z.array(referenceSchema).default([]),
  status: statusSchema,
  lastReviewed: isoDate,
});
export type Project = z.infer<typeof projectSchema>;

// ---------------------------------------------------------------------------
// Certification study tracks
// ---------------------------------------------------------------------------

export const certTrackSchema = z.object({
  slug: z.enum(["network-plus", "security-plus"]),
  name: z.string(),
  examCode: z.string(),
  examVersionLabel: z.string(),
  verifiedOn: isoDate,
  verificationNote: z.string().min(10),
  officialUrl: z.string().url(),
  objectivesUrl: z.string().url().optional(),
  overview: z.string().min(80),
  whoItsFor: z.string().min(30),
  examFormat: z.object({
    questions: z.string(),
    duration: z.string(),
    passingScore: z.string(),
    note: z.string().optional(),
  }),
  costNote: z.string().min(30),
  domains: z
    .array(
      z.object({
        id: slug,
        name: z.string(),
        weightPercent: z.number().int().min(1).max(100),
        topics: z.array(z.string().min(3)).min(2),
      }),
    )
    .min(3),
  lessons: z.array(slug).min(1),
  practicalExercises: z
    .array(z.object({ title: z.string(), body: z.string().min(30), domainId: slug }))
    .min(2),
  reviewChecklist: z
    .array(z.object({ id: slug, text: z.string().min(10), domainId: slug }))
    .min(6),
  courseMapping: z
    .object({
      note: z.string(),
      rows: z
        .array(
          z.object({
            courseTopic: z.string(),
            objective: z.string(),
            lesson: slug.optional(),
            lab: slug.optional(),
          }),
        )
        .default([]),
    })
    .optional(),
  status: statusSchema,
  lastReviewed: isoDate,
  sources: z.array(referenceSchema).default([]),
});
export type CertTrack = z.infer<typeof certTrackSchema>;

export const practiceQuestionSchema = z.object({
  id: slug,
  domainId: slug,
  type: z.enum(["single", "multi"]),
  prompt: z.string().min(20),
  options: z.array(z.object({ id: z.string().regex(/^[a-f]$/), text: z.string().min(1) })).min(3).max(6),
  answer: z.array(z.string().regex(/^[a-f]$/)).min(1),
  explanation: z.string().min(30),
  lessonSlug: slug.optional(),
});
export type PracticeQuestion = z.infer<typeof practiceQuestionSchema>;
export const practiceQuestionsSchema = z.array(practiceQuestionSchema).min(10);

// ---------------------------------------------------------------------------
// Interview preparation
// ---------------------------------------------------------------------------

export const interviewPromptSchema = z.object({
  id: slug,
  question: z.string().min(10),
  strongAnswer: z.array(z.string().min(5)).min(2),
  weakPatterns: z.array(z.string().min(5)).min(1),
  followUps: z.array(z.string().min(5)).min(1),
  roleSpecific: z.array(z.enum(PATH_SLUGS)).optional(),
});

export const interviewTopicSchema = z.object({
  id: slug,
  title: z.string().min(3),
  category: z.enum(["technical", "behavioral", "scenario", "project"]),
  summary: z.string().min(20),
  relatedPaths: z.array(z.enum(PATH_SLUGS)).default([]),
  prompts: z.array(interviewPromptSchema).min(2),
});

export const interviewContentSchema = z.object({
  topics: z.array(interviewTopicSchema).min(5),
  guides: z.array(z.object({ slug, title: z.string(), summary: z.string() })).default([]),
  lastReviewed: isoDate,
});
export type InterviewContent = z.infer<typeof interviewContentSchema>;
export type InterviewTopic = z.infer<typeof interviewTopicSchema>;

export const guideFrontmatterSchema = z.object({
  title: z.string(),
  summary: z.string(),
  lastReviewed: isoDate,
  references: z.array(referenceSchema).default([]),
});

// ---------------------------------------------------------------------------
// Home lab wizard
// ---------------------------------------------------------------------------

export const LAB_OS = ["windows", "linux", "mac-intel", "mac-apple-silicon", "chromebook-or-other"] as const;
export const LAB_ARCH = ["x64", "arm64", "unknown"] as const;

export const labEnvironmentSchema = z.object({
  id: slug,
  name: z.string(),
  summary: z.string().min(30),
  type: z.enum(["local", "browser"]),
  fits: z.object({
    os: z.array(z.enum(LAB_OS)).min(1),
    arch: z.array(z.enum(LAB_ARCH)).min(1),
    minRamGb: z.number().int().min(0),
    minStorageGb: z.number().int().min(0),
    needsAdmin: z.boolean(),
    experience: z.array(z.enum(["new", "some", "experienced"])).min(1),
  }),
  cost: z.string(),
  accountRequired: z.boolean(),
  downloads: z
    .array(z.object({ label: z.string(), url: z.string().url(), verifiedOn: isoDate, note: z.string().optional() }))
    .default([]),
  guideSlug: slug,
  resourceGuidance: z.string().min(20),
  isolationSummary: z.string().min(20),
  status: statusSchema,
});

export const labGuideSchema = z.object({
  intro: z.string().min(40),
  safetyRules: z.array(z.string().min(10)).min(3),
  environments: z.array(labEnvironmentSchema).min(3),
  lastReviewed: isoDate,
  sources: z.array(referenceSchema).default([]),
});
export type LabGuide = z.infer<typeof labGuideSchema>;
export type LabEnvironment = z.infer<typeof labEnvironmentSchema>;

export const LAB_GUIDE_SECTIONS = [
  "Installation",
  "Resource allocation",
  "Network isolation",
  "Snapshots and recovery",
  "Common errors",
  "First exercise",
  "Success check",
  "Cleanup",
] as const;
