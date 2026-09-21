import { CAREER_IDS, type CareerId, type Question, type QuestionOption } from "@/content/careers/types";
import type { Answers } from "./answers";

/**
 * Deterministic questionnaire scoring. No display logic lives here.
 *
 * - Each selected substantive answer adds one point to its path.
 * - "Not sure yet" adds nothing.
 * - A path's score is its points divided by how many answer options map to
 *   it across the whole questionnaire, counted from the question data.
 * - Scores are compared exactly (as fractions), never rounded.
 */

/** Fewer than this many questions with a substantive answer makes results "early suggestions". */
export const EARLY_THRESHOLD = 5;
/** Results show this many paths, plus any paths tied with the last one. */
export const TOP_COUNT = 5;

export type PathScore = {
  path: CareerId;
  points: number;
  /** Number of answer options mapped to this path across the questionnaire. */
  possible: number;
  /** The student's selected answers that earned these points, in question order. */
  selections: { question: Question; option: QuestionOption }[];
};

export type Match = PathScore & {
  /** Shares the top score with at least one other result. Lower ties are not labelled. */
  equallyMatched: boolean;
  /**
   * Share of this path's answers the student picked, 0-100. It describes the
   * answers only: it is not a skill, aptitude or hiring score.
   */
  percent: number;
};

export type MatchSummary = {
  /** Questions answered with at least one substantive choice. */
  substantiveCount: number;
  /** Question ids answered with "Not sure yet", in questionnaire order. */
  unsureQuestionIds: string[];
  /** Question ids with no answer at all. */
  unansweredQuestionIds: string[];
  /** Fewer than EARLY_THRESHOLD substantive answers. */
  early: boolean;
};

export type MatchResult =
  | ({ kind: "exploring" } & MatchSummary)
  | ({ kind: "broad"; scores: PathScore[] } & MatchSummary)
  | ({ kind: "matches"; matches: Match[]; includesTies: boolean } & MatchSummary);

export function optionCounts(questions: readonly Question[]): Record<CareerId, number> {
  const counts = Object.fromEntries(CAREER_IDS.map((id) => [id, 0])) as Record<CareerId, number>;
  for (const question of questions) {
    for (const option of question.options) counts[option.path] += 1;
  }
  return counts;
}

export function scoreAnswers(questions: readonly Question[], answers: Answers): PathScore[] {
  const possible = optionCounts(questions);
  const scores = new Map<CareerId, PathScore>(
    CAREER_IDS.map((path) => [path, { path, points: 0, possible: possible[path], selections: [] }]),
  );
  for (const question of questions) {
    const answer = answers[question.id];
    if (answer?.kind !== "choices") continue;
    for (const option of question.options) {
      if (!answer.optionIds.includes(option.id)) continue;
      const score = scores.get(option.path)!;
      score.points += 1;
      score.selections.push({ question, option });
    }
  }
  return [...scores.values()];
}

/** A path with no mapped options can never score. */
const fraction = (score: Pick<PathScore, "points" | "possible">) =>
  score.possible > 0 ? [score.points, score.possible] : [0, 1];

/** Compares normalized scores exactly, by cross-multiplying: positive when `a` ranks above `b`. */
export function compareScores(a: Pick<PathScore, "points" | "possible">, b: Pick<PathScore, "points" | "possible">) {
  const [an, ad] = fraction(a);
  const [bn, bd] = fraction(b);
  return an * bd - bn * ad;
}

export function summarize(questions: readonly Question[], answers: Answers): MatchSummary {
  const substantiveCount = questions.filter((q) => answers[q.id]?.kind === "choices").length;
  return {
    substantiveCount,
    unsureQuestionIds: questions.filter((q) => answers[q.id]?.kind === "unsure").map((q) => q.id),
    unansweredQuestionIds: questions.filter((q) => !answers[q.id]).map((q) => q.id),
    early: substantiveCount < EARLY_THRESHOLD,
  };
}

export function rankMatches(questions: readonly Question[], answers: Answers): MatchResult {
  const summary = summarize(questions, answers);
  const scores = scoreAnswers(questions, answers);
  const positive = scores.filter((score) => score.possible > 0 && score.points > 0);

  if (!positive.length) return { kind: "exploring", ...summary };

  const scorable = scores.filter((score) => score.possible > 0);
  if (scorable.length === CAREER_IDS.length && scorable.every((score) => compareScores(score, scorable[0]) === 0)) {
    return { kind: "broad", scores, ...summary };
  }

  // Stable sort keeps questionnaire path order among equal scores.
  const ranked = [...positive].sort((a, b) => compareScores(b, a));
  const cutoff = ranked[Math.min(TOP_COUNT, ranked.length) - 1];
  const shown = ranked.filter((score) => compareScores(score, cutoff) >= 0);
  const top = ranked[0];
  const matches = shown.map((score) => ({
    ...score,
    equallyMatched:
      compareScores(score, top) === 0 && shown.some((other) => other !== score && compareScores(other, score) === 0),
    percent: Math.round((score.points / score.possible) * 100),
  }));
  return { kind: "matches", matches, includesTies: matches.length > TOP_COUNT, ...summary };
}
