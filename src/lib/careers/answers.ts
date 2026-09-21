import type { Question } from "@/content/careers/types";

/**
 * A question's answer: up to two substantive choices, or "Not sure yet".
 * Questions without an entry have not been answered.
 */
export type Answer = { kind: "choices"; optionIds: string[] } | { kind: "unsure" };
export type Answers = Readonly<Record<string, Answer>>;

export const MAX_CHOICES = 2;

export type ToggleResult = {
  answer: Answer | undefined;
  /** True when the student tried to add a third choice; the answer is unchanged. */
  limitReached: boolean;
};

/** Selecting or clearing one substantive option. "Not sure yet" is replaced by a real choice. */
export function toggleChoice(current: Answer | undefined, optionId: string): ToggleResult {
  const chosen = current?.kind === "choices" ? current.optionIds : [];
  if (chosen.includes(optionId)) {
    const remaining = chosen.filter((id) => id !== optionId);
    return { answer: remaining.length ? { kind: "choices", optionIds: remaining } : undefined, limitReached: false };
  }
  if (chosen.length >= MAX_CHOICES) return { answer: current, limitReached: true };
  return { answer: { kind: "choices", optionIds: [...chosen, optionId] }, limitReached: false };
}

/** "Not sure yet" clears any choices; selecting it again clears the answer. */
export function toggleUnsure(current: Answer | undefined): Answer | undefined {
  return current?.kind === "unsure" ? undefined : { kind: "unsure" };
}

export function isAnswered(answer: Answer | undefined) {
  return answer?.kind === "unsure" || (answer?.kind === "choices" && answer.optionIds.length > 0);
}

/**
 * Keeps only answers that still match the questionnaire, so stale or edited
 * session data can never add points or crash the results page.
 */
export function sanitizeAnswers(questions: readonly Question[], value: unknown): Record<string, Answer> {
  const clean: Record<string, Answer> = {};
  if (!value || typeof value !== "object") return clean;
  for (const question of questions) {
    const raw = (value as Record<string, unknown>)[question.id];
    if (!raw || typeof raw !== "object") continue;
    const answer = raw as { kind?: unknown; optionIds?: unknown };
    if (answer.kind === "unsure") {
      clean[question.id] = { kind: "unsure" };
    } else if (answer.kind === "choices" && Array.isArray(answer.optionIds)) {
      const valid = question.options.map((option) => option.id);
      const optionIds = [...new Set(answer.optionIds.filter((id): id is string => typeof id === "string" && valid.includes(id)))].slice(0, MAX_CHOICES);
      if (optionIds.length) clean[question.id] = { kind: "choices", optionIds };
    }
  }
  return clean;
}
