/**
 * Validates every content file against the schemas and cross-references
 * (lesson slugs, project slugs, interview topics, questionnaire weights).
 * Usage: npm run content:check
 */
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
  questionnaireSchema,
  LAB_GUIDE_SECTIONS,
  PATH_SLUGS,
} from "../src/content/schemas";

const ROOT = path.join(process.cwd(), "content");
const errors: string[] = [];
const warnings: string[] = [];

function rel(f: string) {
  return path.relative(process.cwd(), f).replace(/\\/g, "/");
}
function json(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    errors.push(`${rel(file)}: ${(e as Error).message}`);
    return null;
  }
}
function validate<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: { issues: { path: PropertyKey[]; message: string }[] } } }, value: unknown, file: string): T | null {
  if (value === null) return null;
  const r = schema.safeParse(value);
  if (!r.success || r.data === undefined) {
    for (const i of r.error?.issues ?? []) errors.push(`${rel(file)} -> ${i.path.join(".") || "(root)"}: ${i.message}`);
    return null;
  }
  return r.data;
}
function dirs(d: string) {
  return fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name) : [];
}
function files(d: string, ext: string) {
  return fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith(ext)) : [];
}
function wordCount(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

// Interview topics (needed for cross refs)
const interviewFile = path.join(ROOT, "interview", "topics.json");
const interview = validate<{ topics: { id: string; prompts: { id: string }[] }[]; guides: { slug: string }[] }>(interviewContentSchema, json(interviewFile), interviewFile);
const topicIds = new Set(interview?.topics.map((t) => t.id) ?? []);
if (interview) {
  const promptIds = new Set<string>();
  for (const t of interview.topics)
    for (const p of t.prompts) {
      if (promptIds.has(p.id)) errors.push(`interview/topics.json: duplicate prompt id ${p.id}`);
      promptIds.add(p.id);
    }
  for (const g of interview.guides) {
    const f = path.join(ROOT, "interview", "guides", `${g.slug}.md`);
    if (!fs.existsSync(f)) errors.push(`interview/topics.json: guide ${g.slug} has no file ${rel(f)}`);
    else validate(guideFrontmatterSchema, matter(fs.readFileSync(f, "utf8")).data, f);
  }
}

// Projects
const projectSlugs = new Set<string>();
for (const f of files(path.join(ROOT, "projects"), ".json")) {
  const file = path.join(ROOT, "projects", f);
  const p = validate<{ slug: string; interviewTopics: string[]; steps: { id: string }[] }>(projectSchema, json(file), file);
  if (!p) continue;
  if (`${p.slug}.json` !== f) errors.push(`${rel(file)}: slug must match file name`);
  projectSlugs.add(p.slug);
  const ids = new Set<string>();
  for (const s of p.steps) {
    if (ids.has(s.id)) errors.push(`${rel(file)}: duplicate step id ${s.id}`);
    ids.add(s.id);
  }
  for (const t of p.interviewTopics) if (!topicIds.has(t)) errors.push(`${rel(file)}: unknown interview topic ${t}`);
}

// Paths + lessons
const pathsRoot = path.join(ROOT, "paths");
let completePaths = 0;
for (const dir of dirs(pathsRoot)) {
  const file = path.join(pathsRoot, dir, "path.json");
  if (!fs.existsSync(file)) {
    errors.push(`paths/${dir}: missing path.json`);
    continue;
  }
  const p = validate<{ slug: string; availability: string; modules: { slug: string; lessons: string[] }[]; portfolioProject?: string; interviewTopics: string[] }>(pathSchema, json(file), file);
  if (!p) continue;
  if (p.slug !== dir) errors.push(`${rel(file)}: slug must match folder name`);
  const lessonDir = path.join(pathsRoot, dir, "lessons");
  const lessonFiles = new Set(files(lessonDir, ".md").map((f) => f.replace(/\.md$/, "")));
  const referenced = new Set<string>();
  for (const m of p.modules)
    for (const l of m.lessons) {
      if (referenced.has(l)) errors.push(`${rel(file)}: lesson ${l} listed twice`);
      referenced.add(l);
      if (!lessonFiles.has(l)) errors.push(`${rel(file)}: module ${m.slug} references missing lesson ${l}`);
    }
  for (const l of lessonFiles) if (!referenced.has(l)) warnings.push(`paths/${dir}/lessons/${l}.md is not listed in any module`);
  for (const l of lessonFiles) {
    const lf = path.join(lessonDir, `${l}.md`);
    const parsed = matter(fs.readFileSync(lf, "utf8"));
    const fm = validate<{ kind: string }>(lessonFrontmatterSchema, parsed.data, lf);
    const wc = wordCount(parsed.content);
    if (fm && wc < 250) warnings.push(`${rel(lf)}: only ${wc} words`);
    if (/<[a-z][\s\S]*>/i.test(parsed.content)) warnings.push(`${rel(lf)}: contains raw HTML which will not render`);
  }
  if (p.availability === "complete") {
    completePaths++;
    if (p.modules.length < 3) errors.push(`${rel(file)}: complete paths need at least 3 modules`);
    if (!p.portfolioProject) errors.push(`${rel(file)}: complete paths need a portfolioProject`);
  }
  if (p.portfolioProject && !projectSlugs.has(p.portfolioProject)) errors.push(`${rel(file)}: unknown portfolioProject ${p.portfolioProject}`);
  for (const t of p.interviewTopics) if (!topicIds.has(t)) errors.push(`${rel(file)}: unknown interview topic ${t}`);
}
const presentPaths = new Set(dirs(pathsRoot));
for (const s of PATH_SLUGS) if (!presentPaths.has(s)) warnings.push(`paths/${s} missing (catalog entry expected)`);

// Certification tracks
const certRoot = path.join(ROOT, "certifications");
for (const dir of dirs(certRoot)) {
  const file = path.join(certRoot, dir, "track.json");
  const t = validate<{ slug: string; lessons: string[]; domains: { id: string }[]; reviewChecklist: { id: string; domainId: string }[]; practicalExercises: { domainId: string }[] }>(certTrackSchema, json(file), file);
  if (!t) continue;
  const domainIds = new Set(t.domains.map((d) => d.id));
  const lessonDir = path.join(certRoot, dir, "lessons");
  const lessonFiles = new Set(files(lessonDir, ".md").map((f) => f.replace(/\.md$/, "")));
  for (const l of t.lessons) if (!lessonFiles.has(l)) errors.push(`${rel(file)}: missing lesson ${l}`);
  for (const l of lessonFiles) {
    const lf = path.join(lessonDir, `${l}.md`);
    validate(lessonFrontmatterSchema, matter(fs.readFileSync(lf, "utf8")).data, lf);
    if (!t.lessons.includes(l)) warnings.push(`${rel(lf)} not listed in track.json lessons`);
  }
  for (const c of t.reviewChecklist) if (!domainIds.has(c.domainId)) errors.push(`${rel(file)}: checklist ${c.id} references unknown domain ${c.domainId}`);
  for (const ex of t.practicalExercises) if (!domainIds.has(ex.domainId)) errors.push(`${rel(file)}: exercise references unknown domain ${ex.domainId}`);
  const qf = path.join(certRoot, dir, "questions.json");
  if (!fs.existsSync(qf)) errors.push(`${rel(qf)}: missing practice questions`);
  else {
    const qs = validate<{ id: string; domainId: string; options: { id: string }[]; answer: string[]; type: string; lessonSlug?: string }[]>(practiceQuestionsSchema, json(qf), qf);
    if (qs) {
      const ids = new Set<string>();
      for (const q of qs) {
        if (ids.has(q.id)) errors.push(`${rel(qf)}: duplicate question id ${q.id}`);
        ids.add(q.id);
        if (!domainIds.has(q.domainId)) errors.push(`${rel(qf)}: ${q.id} unknown domain ${q.domainId}`);
        const optIds = new Set(q.options.map((o) => o.id));
        if (optIds.size !== q.options.length) errors.push(`${rel(qf)}: ${q.id} duplicate option ids`);
        for (const a of q.answer) if (!optIds.has(a)) errors.push(`${rel(qf)}: ${q.id} answer ${a} not an option`);
        if (q.type === "single" && q.answer.length !== 1) errors.push(`${rel(qf)}: ${q.id} single-answer question must have exactly one answer`);
        if (q.lessonSlug && !lessonFiles.has(q.lessonSlug)) errors.push(`${rel(qf)}: ${q.id} unknown lessonSlug ${q.lessonSlug}`);
      }
    }
  }
}

// Lab guide
const labFile = path.join(ROOT, "lab", "lab-guide.json");
const lab = validate<{ environments: { id: string; guideSlug: string }[] }>(labGuideSchema, json(labFile), labFile);
if (lab) {
  for (const env of lab.environments) {
    const gf = path.join(ROOT, "lab", "environments", `${env.guideSlug}.md`);
    if (!fs.existsSync(gf)) {
      errors.push(`lab/lab-guide.json: environment ${env.id} guide file missing (${rel(gf)})`);
      continue;
    }
    const parsed = matter(fs.readFileSync(gf, "utf8"));
    validate(guideFrontmatterSchema, parsed.data, gf);
    for (const section of LAB_GUIDE_SECTIONS) {
      if (!new RegExp(`^## ${section}\\s*$`, "m").test(parsed.content)) errors.push(`${rel(gf)}: missing required section "## ${section}"`);
    }
  }
}

// Questionnaire
const qFile = path.join(ROOT, "questionnaire.json");
const q = validate<{ questions: { id: string; options: { id: string; weights: Record<string, number> }[] }[] }>(questionnaireSchema, json(qFile), qFile);
if (q) {
  const ids = new Set<string>();
  for (const question of q.questions) {
    if (ids.has(question.id)) errors.push(`questionnaire.json: duplicate question id ${question.id}`);
    ids.add(question.id);
    for (const o of question.options)
      for (const k of Object.keys(o.weights)) if (!(PATH_SLUGS as readonly string[]).includes(k)) errors.push(`questionnaire.json: ${question.id}/${o.id} weights unknown path ${k}`);
  }
}

if (completePaths < 3) warnings.push(`only ${completePaths} complete path(s); the first version targets 3`);

for (const w of warnings) console.log(`warning: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  console.error(`\n${errors.length} content error(s).`);
  process.exit(1);
}
console.log(`Content OK (${warnings.length} warning(s)).`);
