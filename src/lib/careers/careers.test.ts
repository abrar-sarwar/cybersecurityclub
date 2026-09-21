import assert from "node:assert/strict";
import test from "node:test";
import { CAREER_BY_ID, CAREER_PATHS, getCareerBySlug } from "@/content/careers/paths";
import { CAREER_SCENARIOS } from "@/content/careers/scenarios";
import { CAREER_FLOWS } from "@/content/careers/flows";
import { QUESTIONS } from "@/content/careers/questions";
import { DIFFICULTY, DIFFICULTY_ORDER, LIBRARY_PROJECTS, PROJECTS_BY_PATH, byResumeWeight, getLibraryProject } from "@/content/careers/projects";
import { FRAMEWORK_HOWTO, GITHUB_WALKTHROUGH, PROJECT_BENEFITS } from "@/content/careers/github";
import { CAREER_IDS, type CareerId, type Question } from "@/content/careers/types";
import { MAX_CHOICES, isAnswered, sanitizeAnswers, toggleChoice, toggleUnsure, type Answer, type Answers } from "./answers";
import { EARLY_THRESHOLD, TOP_COUNT, compareScores, optionCounts, rankMatches, scoreAnswers } from "./scoring";

const choices = (...optionIds: string[]): Answer => ({ kind: "choices", optionIds });
const unsure: Answer = { kind: "unsure" };

/** Small questionnaire where each option id is "<question>-<path>". */
function questionnaire(spec: CareerId[][]): Question[] {
  return spec.map((paths, index) => ({
    id: `t${index + 1}`,
    prompt: `Question ${index + 1}`,
    options: paths.map((path) => ({ id: `t${index + 1}-${path}`, text: `${path} option`, path })),
  }));
}

// Selection rules --------------------------------------------------------------

test("one or two answers can be selected, and a third is refused", () => {
  let result = toggleChoice(undefined, "q1-a");
  assert.deepEqual(result, { answer: choices("q1-a"), limitReached: false });
  result = toggleChoice(result.answer, "q1-c");
  assert.deepEqual(result, { answer: choices("q1-a", "q1-c"), limitReached: false });
  const third = toggleChoice(result.answer, "q1-d");
  assert.equal(third.limitReached, true);
  assert.deepEqual(third.answer, choices("q1-a", "q1-c"), "the earlier choices are kept");
  assert.equal(MAX_CHOICES, 2);
});

test("selecting a chosen answer again clears it", () => {
  assert.deepEqual(toggleChoice(choices("q1-a", "q1-b"), "q1-a").answer, choices("q1-b"));
  assert.equal(toggleChoice(choices("q1-b"), "q1-b").answer, undefined);
});

test("“Not sure yet” clears choices, and a real choice clears “Not sure yet”", () => {
  assert.deepEqual(toggleUnsure(choices("q1-a", "q1-b")), unsure);
  assert.equal(toggleUnsure(unsure), undefined);
  assert.deepEqual(toggleChoice(unsure, "q1-d"), { answer: choices("q1-d"), limitReached: false });
});

test("a question counts as answered only with a choice or “Not sure yet”", () => {
  assert.equal(isAnswered(undefined), false);
  assert.equal(isAnswered(choices()), false);
  assert.equal(isAnswered(choices("q1-a")), true);
  assert.equal(isAnswered(unsure), true);
});

test("stored answers are cleaned before use", () => {
  const cleaned = sanitizeAnswers(QUESTIONS, {
    q1: { kind: "choices", optionIds: ["q1-a", "q1-a", "q2-b", "nope"] },
    q2: { kind: "choices", optionIds: ["q2-a", "q2-b", "q2-c"] },
    q3: { kind: "unsure", optionIds: ["q3-a"] },
    q4: { kind: "choices", optionIds: [] },
    q5: "garbage",
    unknown: { kind: "unsure" },
  });
  assert.deepEqual(cleaned, { q1: choices("q1-a"), q2: choices("q2-a", "q2-b"), q3: unsure });
  assert.deepEqual(sanitizeAnswers(QUESTIONS, null), {});
});

// Scoring ------------------------------------------------------------------------

test("denominators come from the question data", () => {
  const questions = questionnaire([["soc", "soc", "intel"], ["soc", "ir"]]);
  const counts = optionCounts(questions);
  assert.equal(counts.soc, 3);
  assert.equal(counts.intel, 1);
  assert.equal(counts.ir, 1);
  assert.equal(counts.cloud, 0);

  const real = optionCounts(QUESTIONS);
  assert.equal(Object.values(real).reduce((sum, count) => sum + count, 0), QUESTIONS.length * 4);
  for (const id of CAREER_IDS) assert.ok(real[id] > 0, `${id} can be reached`);
});

test("each selected answer adds one point and “Not sure yet” adds nothing", () => {
  const questions = questionnaire([["soc", "intel"], ["soc", "ir"], ["cloud", "iam"]]);
  const scores = scoreAnswers(questions, { t1: choices("t1-soc", "t1-intel"), t2: choices("t2-soc"), t3: unsure });
  const points = Object.fromEntries(scores.map((score) => [score.path, score.points]));
  assert.equal(points.soc, 2);
  assert.equal(points.intel, 1);
  assert.equal(points.ir, 0);
  assert.equal(points.cloud, 0);
  assert.deepEqual(scores.find((s) => s.path === "soc")!.selections.map((s) => s.option.id), ["t1-soc", "t2-soc"]);
});

test("scores are normalized by how many options map to each path", () => {
  // soc appears four times, intel once: one point for intel outranks two for soc.
  const questions = questionnaire([["soc", "intel"], ["soc", "ir"], ["soc", "cloud"], ["soc", "iam"]]);
  const result = rankMatches(questions, { t1: choices("t1-soc", "t1-intel"), t2: choices("t2-soc"), t3: unsure, t4: unsure });
  assert.equal(result.kind, "matches");
  if (result.kind !== "matches") return;
  assert.deepEqual(result.matches.map((m) => m.path), ["intel", "soc"]);
  assert.ok(compareScores({ points: 1, possible: 1 }, { points: 2, possible: 4 }) > 0);
  assert.equal(compareScores({ points: 1, possible: 3 }, { points: 2, possible: 6 }), 0, "compared exactly, not rounded");
});

test("changing an answer replaces its earlier contribution", () => {
  const questions = questionnaire([["soc", "intel"]]);
  const before = scoreAnswers(questions, { t1: choices("t1-soc") });
  const after = scoreAnswers(questions, { t1: toggleChoice(toggleChoice(choices("t1-soc"), "t1-soc").answer, "t1-intel").answer! });
  assert.equal(before.find((s) => s.path === "soc")!.points, 1);
  assert.equal(after.find((s) => s.path === "soc")!.points, 0);
  assert.equal(after.find((s) => s.path === "intel")!.points, 1);
});

test("results show the top five and never fill slots with zero-score paths", () => {
  const questions = questionnaire([["soc", "intel", "ir", "cloud"], ["soc", "intel", "ir", "cloud"], ["iam", "grc", "network", "malware"]]);
  const two = rankMatches(questions, { t1: choices("t1-soc"), t2: choices("t2-soc", "t2-intel"), t3: unsure });
  assert.equal(two.kind, "matches");
  if (two.kind === "matches") {
    assert.deepEqual(two.matches.map((m) => m.path), ["soc", "intel"]);
    assert.ok(two.matches.every((m) => m.points > 0));
    assert.equal(two.includesTies, false);
    // soc: both of its options; intel: one of two.
    assert.deepEqual(two.matches.map((m) => m.percent), [100, 50]);
  }

  const four = rankMatches(questions, { t1: choices("t1-soc", "t1-intel"), t2: choices("t2-soc", "t2-ir"), t3: choices("t3-iam") });
  assert.equal(four.kind, "matches");
  if (four.kind === "matches") {
    // soc 2/2 and iam 1/1 lead; intel and ir sit at 1/2. All four fit in the top five.
    assert.deepEqual(four.matches.map((m) => m.path), ["soc", "iam", "intel", "ir"]);
    assert.equal(four.includesTies, false);
    // Only the tie for first place is labelled; the pair below it is not.
    assert.deepEqual(four.matches.map((m) => m.equallyMatched), [true, true, false, false]);
  }
});

test("paths tied at the fifth place cutoff are included and labeled", () => {
  const questions = questionnaire([
    ["soc", "offensive"],
    ["appsec", "intel"],
    ["ir", "cloud"],
    ["iam", "grc"],
    ["forensics", "hunting"],
    ["network", "malware"],
    ["soc", "offensive"],
  ]);
  // soc scores 2/2; five other paths share 1/1, so all six appear.
  const result = rankMatches(questions, {
    t1: choices("t1-soc"),
    t2: choices("t2-appsec"),
    t3: choices("t3-ir"),
    t4: choices("t4-iam"),
    t5: choices("t5-forensics"),
    t6: choices("t6-network"),
    t7: choices("t7-soc"),
  });
  assert.equal(result.kind, "matches");
  if (result.kind !== "matches") return;
  assert.deepEqual(result.matches.map((m) => m.path), ["soc", "appsec", "ir", "iam", "forensics", "network"]);
  assert.equal(result.matches.length, TOP_COUNT + 1, "the sixth path ties with the fifth");
  assert.equal(result.includesTies, true);
  assert.deepEqual(result.matches.map((m) => m.equallyMatched), [true, true, true, true, true, true]);
});

test("match percentages describe the share of a path's answers that were picked", () => {
  const questions = questionnaire([["soc", "intel"], ["soc", "ir"], ["soc", "cloud"], ["soc", "iam"]]);
  const result = rankMatches(questions, { t1: choices("t1-soc", "t1-intel"), t2: choices("t2-soc"), t3: unsure, t4: unsure });
  assert.equal(result.kind, "matches");
  if (result.kind !== "matches") return;
  const percent = Object.fromEntries(result.matches.map((m) => [m.path, m.percent]));
  assert.equal(percent.soc, 50, "two of soc's four options");
  assert.equal(percent.intel, 100, "intel's only option");
});


test("answering “Not sure yet” to everything shows the exploration state", () => {
  const answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, unsure]));
  const result = rankMatches(QUESTIONS, answers);
  assert.equal(result.kind, "exploring");
  assert.equal(result.unsureQuestionIds.length, 20);
  assert.equal(result.substantiveCount, 0);
});

test("a twelve-way tie shows the broad-interest state instead of a winner", () => {
  const questions = questionnaire([
    ["soc", "offensive"],
    ["appsec", "intel"],
    ["ir", "cloud"],
    ["iam", "grc"],
    ["forensics", "hunting"],
    ["network", "malware"],
  ]);
  const answers = Object.fromEntries(questions.map((q) => [q.id, choices(...q.options.map((o) => o.id))]));
  const result = rankMatches(questions, answers);
  assert.equal(result.kind, "broad");
  assert.equal(result.early, false);
});

test("fewer than five substantive answers are early suggestions", () => {
  const partial: Record<string, Answer> = Object.fromEntries(QUESTIONS.map((q) => [q.id, unsure]));
  for (const q of QUESTIONS.slice(0, EARLY_THRESHOLD - 1)) partial[q.id] = choices(q.options[0].id);
  const early = rankMatches(QUESTIONS, partial);
  assert.equal(early.kind, "matches");
  assert.equal(early.early, true);
  assert.equal(early.unsureQuestionIds[0], `q${EARLY_THRESHOLD}`);

  partial[QUESTIONS[EARLY_THRESHOLD - 1].id] = choices(QUESTIONS[EARLY_THRESHOLD - 1].options[0].id);
  assert.equal(rankMatches(QUESTIONS, partial).early, false);
});

test("the real questionnaire produces grounded, deterministic matches", () => {
  const answers: Answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, choices(q.options.find((o) => o.path === "hunting" || o.path === "soc")?.id ?? q.options[0].id)]));
  const first = rankMatches(QUESTIONS, answers);
  const second = rankMatches(QUESTIONS, answers);
  assert.deepEqual(first, second);
  assert.equal(first.kind, "matches");
  if (first.kind !== "matches") return;
  assert.ok(first.matches.length >= 1 && first.matches.length <= 12);
  for (const match of first.matches) {
    assert.equal(match.selections.length, match.points);
    for (const { question, option } of match.selections) {
      assert.equal(option.path, match.path);
      assert.ok((answers[question.id] as { optionIds: string[] }).optionIds.includes(option.id));
    }
  }
});

// Content ------------------------------------------------------------------------

test("the questionnaire has twenty questions with four uniquely identified options", () => {
  assert.equal(QUESTIONS.length, 20);
  const questionIds = new Set(QUESTIONS.map((q) => q.id));
  assert.equal(questionIds.size, 20);
  const optionIds = QUESTIONS.flatMap((q) => q.options.map((o) => o.id));
  assert.equal(new Set(optionIds).size, optionIds.length);
  for (const question of QUESTIONS) {
    assert.equal(question.options.length, 4, question.id);
    assert.ok(question.prompt.trim().length > 10);
    for (const option of question.options) assert.ok(CAREER_IDS.includes(option.path), option.id);
  }
});

test("every career path has complete, linked content", () => {
  assert.deepEqual(CAREER_PATHS.map((p) => p.id).toSorted(), [...CAREER_IDS].toSorted());
  assert.equal(new Set(CAREER_PATHS.map((p) => p.slug)).size, CAREER_PATHS.length);
  for (const path of CAREER_PATHS) {
    assert.equal(CAREER_BY_ID[path.id], path);
    assert.equal(getCareerBySlug(path.slug), path);
    assert.match(path.slug, /^[a-z0-9-]+$/);
    for (const text of [path.name, path.summary, path.workFocus, path.project.title, path.project.summary, path.project.extension, path.project.resumeExample.name, path.project.resumeExample.bullet]) {
      assert.ok(text.trim().length > 3, `${path.id}: ${text}`);
    }
    assert.ok(path.overview.length >= 2, `${path.id} overview`);
    assert.ok(path.terms.length >= 3, `${path.id} terms`);
    assert.ok(path.tasks.length >= 4, `${path.id} tasks`);
    assert.ok(path.roles.length >= 2, `${path.id} roles`);
    assert.ok(path.project.steps.length >= 4 && path.project.steps.length <= 8, `${path.id} walkthrough`);
    assert.ok(path.project.publish.length >= 2, `${path.id} publish`);
    assert.ok(path.related.length >= 2 && path.related.every((id) => id !== path.id && CAREER_IDS.includes(id)), `${path.id} related`);
    for (const resource of path.resources) assert.match(resource.href, /^https:\/\//, `${path.id} resource`);
    assert.doesNotMatch(JSON.stringify(path), /lorem|TODO|placeholder/i, `${path.id} has no placeholder text`);
    // The résumé example lists the tools and frameworks, not just an activity.
    assert.ok(path.project.resumeExample.stack.length >= 3, `${path.id} résumé tools`);
    assert.ok(path.project.resumeExample.stack.every((tool) => tool.trim().length > 1), `${path.id} tool names`);
    // Every project says what to count, and the example bullet carries numbers.
    assert.ok(path.project.metrics.length >= 3, `${path.id} metrics`);
    for (const metric of path.project.metrics) {
      assert.ok(metric.label.trim().length > 3 && metric.source.trim().length > 8, `${path.id} metric text`);
    }
    assert.match(path.project.resumeExample.bullet, /\d/, `${path.id} example bullet has numbers`);
    assert.doesNotMatch(JSON.stringify(path), /—/, `${path.id} has no em dashes`);
  }
});

test("every path has a work flow and a day-on-the-job scenario", () => {
  for (const path of CAREER_PATHS) {
    const flow = CAREER_FLOWS[path.id];
    assert.equal(flow.length, 5, `${path.id} flow steps`);
    for (const step of flow) {
      assert.ok(step.label.trim().length > 2 && step.note.trim().length > 8, `${path.id} flow text`);
    }

    const scenario = CAREER_SCENARIOS[path.id];
    assert.ok(scenario.subject.trim().length > 8, `${path.id} subject`);
    assert.ok(scenario.setup.trim().length > 40, `${path.id} setup`);
    assert.ok(scenario.takeaway.trim().length > 40, `${path.id} takeaway`);
    assert.equal(scenario.steps.length, 3, `${path.id} steps`);
    for (const step of scenario.steps) {
      assert.equal(step.options.length, 3, `${path.id} options`);
      assert.equal(new Set(step.options.map((o) => o.id)).size, 3, `${path.id} option ids`);
      assert.equal(step.options.filter((o) => o.verdict === "strong").length, 1, `${path.id} one strong choice`);
      for (const option of step.options) assert.ok(option.outcome.trim().length > 20, `${path.id} outcome text`);
    }
  }
});

test("the project library is ranked, complete and concise", () => {
  assert.ok(LIBRARY_PROJECTS.length >= 30, "at least thirty projects");
  assert.equal(new Set(LIBRARY_PROJECTS.map((p) => p.slug)).size, LIBRARY_PROJECTS.length, "unique slugs");
  assert.equal(new Set(LIBRARY_PROJECTS.map((p) => p.title)).size, LIBRARY_PROJECTS.length, "unique titles");
  // Ranks run 1..n with no gaps, so "best first" ordering is unambiguous.
  assert.deepEqual(
    LIBRARY_PROJECTS.map((p) => p.rank).toSorted((a, b) => a - b),
    LIBRARY_PROJECTS.map((_, index) => index + 1),
  );
  // Every career path has at least two projects, so results always lead somewhere.
  for (const id of CAREER_IDS) assert.ok(PROJECTS_BY_PATH(id).length >= 2, `${id} projects`);

  for (const project of LIBRARY_PROJECTS) {
    assert.equal(getLibraryProject(project.slug), project);
    assert.match(project.slug, /^[a-z0-9-]+$/, project.slug);
    assert.ok(CAREER_IDS.includes(project.path), `${project.slug} path`);
    assert.ok(DIFFICULTY_ORDER.includes(project.difficulty), `${project.slug} difficulty`);
    // Five names to choose from, so no two students publish the same title.
    assert.ok(project.nameIdeas.length >= 5, `${project.slug} name ideas`);
    assert.equal(new Set(project.nameIdeas).size, project.nameIdeas.length, `${project.slug} unique names`);
    assert.ok(project.stack.length >= 3, `${project.slug} stack`);
    assert.ok(project.frameworks.length >= 1, `${project.slug} frameworks`);
    for (const framework of project.frameworks) {
      assert.ok(framework.name.trim().length > 2 && framework.use.trim().length > 20, `${project.slug} framework text`);
    }
    assert.ok(project.steps.length >= 5 && project.steps.length <= 8, `${project.slug} steps`);
    assert.ok(project.publish.length >= 3, `${project.slug} publish`);
    // Concise: cards show the summary and the benefit, so both stay short.
    assert.ok(project.summary.length <= 110, `${project.slug} summary length`);
    assert.ok(project.benefit.length <= 130, `${project.slug} benefit length`);
    for (const step of project.steps) assert.ok(step.length <= 110, `${project.slug} step length: ${step}`);
    assert.match(project.resumeBullet, /\d/, `${project.slug} bullet has numbers`);
    assert.doesNotMatch(JSON.stringify(project), /—/, `${project.slug} has no em dashes`);
    assert.doesNotMatch(JSON.stringify(project), /lorem|TODO|placeholder/i, `${project.slug} placeholder text`);
  }
});

test("difficulty doubles as the résumé signal, and every level is populated", () => {
  // Filters are only useful if each one has something behind it.
  for (const level of DIFFICULTY_ORDER) {
    const count = LIBRARY_PROJECTS.filter((project) => project.difficulty === level).length;
    assert.ok(count >= 5, `${level} has ${count} projects`);
  }
  // Harder means more weight, and the résumé sort puts the hard ones first.
  assert.deepEqual(DIFFICULTY_ORDER.map((level) => DIFFICULTY[level].weight), [1, 2, 3]);
  const sorted = [...LIBRARY_PROJECTS].sort(byResumeWeight);
  assert.equal(sorted[0].difficulty, "hard");
  assert.equal(sorted.at(-1)!.difficulty, "easy");
  const weights = sorted.map((project) => DIFFICULTY[project.difficulty].weight);
  assert.deepEqual(weights, [...weights].sort((a, b) => b - a), "weights never increase down the list");
  // Ties inside a level keep the ranked order.
  const hard = sorted.filter((project) => project.difficulty === "hard").map((project) => project.rank);
  assert.deepEqual(hard, [...hard].sort((a, b) => a - b));
});

test("the GitHub and framework guides teach the whole loop", () => {
  assert.ok(GITHUB_WALKTHROUGH.steps.length >= 6, "walkthrough steps");
  for (const step of GITHUB_WALKTHROUGH.steps) {
    assert.ok(step.command.trim().length > 3, `${step.label} command`);
    assert.ok(step.seen.trim().length > 20, `${step.label} what you see`);
    assert.ok(step.note.trim().length > 20, `${step.label} note`);
  }
  assert.ok(FRAMEWORK_HOWTO.steps.length >= 4, "framework steps");
  assert.ok(PROJECT_BENEFITS.length >= 3, "benefits");
  assert.doesNotMatch(JSON.stringify([GITHUB_WALKTHROUGH, FRAMEWORK_HOWTO, PROJECT_BENEFITS]), /—/, "no em dashes");
});
