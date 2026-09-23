/**
 * Career exploration content types. Career identifiers are stable: they are
 * stored in questionnaire answers and scoring, so rename a path's display name
 * or slug freely but never its id.
 */
export const CAREER_IDS = [
  "soc",
  "offensive",
  "appsec",
  "intel",
  "ir",
  "cloud",
  "iam",
  "grc",
  "forensics",
  "hunting",
  "network",
  "malware",
] as const;

export type CareerId = (typeof CAREER_IDS)[number];

export type QuestionOption = {
  /** Stable id such as "q1-a"; stored in session answers. */
  id: string;
  text: string;
  /** Internal scoring target. Never shown beside the answer. */
  path: CareerId;
};

export type Question = {
  /** Stable id such as "q1". */
  id: string;
  prompt: string;
  options: readonly QuestionOption[];
};

export type Term = { term: string; definition: string };

export type Resource = {
  label: string;
  href: string;
  /** Why the resource helps with this path's project. */
  description: string;
};

export type StarterProject = {
  title: string;
  /** One or two sentences, used for previews in results. */
  summary: string;
  /** Tools, data, or environments the project uses. */
  materials: string[];
  /** Short numbered walkthrough. */
  steps: string[];
  /** What the student publishes when finished. */
  publish: string[];
  extension: string;
  /** Scope or safety clarifications shown with the project. */
  notes?: string[];
  /** What to count while working, so the write-up and résumé line carry real numbers. */
  metrics: { label: string; source: string }[];
  /**
   * Example résumé entry, adapted after the work is done. It reads
   * "name | tools and frameworks | link", so the tools are visible at a glance.
   */
  resumeExample: {
    /** An example project name; students pick their own. */
    name: string;
    /** Tools, datasets and frameworks used, listed after the name. */
    stack: string[];
    bullet: string;
  };
};

export type CareerPath = {
  id: CareerId;
  slug: string;
  name: string;
  /** Plain-language description used on cards and in results. */
  summary: string;
  /**
   * Completes the sentence "Your answers point toward work that involves …".
   * Describes the work, never the student.
   */
  workFocus: string;
  /** What people in this area work on. */
  overview: string[];
  /** Technical terms used on the page, explained in plain language. */
  terms: Term[];
  tasks: string[];
  roles: string[];
  project: StarterProject;
  related: CareerId[];
  resources: Resource[];
};

/**
 * A path that has been announced but not yet written. It appears in the list
 * so students can see what is coming, and carries no slug, starter project or
 * quiz scoring until the full pathway exists.
 */
export type UpcomingPath = {
  name: string;
  summary: string;
  roles: string[];
};
