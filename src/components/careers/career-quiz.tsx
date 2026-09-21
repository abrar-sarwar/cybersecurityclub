"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, HelpCircle, Skull } from "lucide-react";
import { ScrambleText } from "./scramble-text";
import { QUESTIONS } from "@/content/careers/questions";
import { MAX_CHOICES, isAnswered, toggleChoice, toggleUnsure } from "@/lib/careers/answers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { LOADING, clearAttempt, emptyAttempt, saveAttempt, useAttempt, type Attempt } from "./attempt-store";

const TOTAL = QUESTIONS.length;
const LETTERS = ["A", "B", "C", "D"];
/** Capture-the-flag flavour for the progress meter. The real label stays "Question X of 20". */
const STAGES = ["scanning target", "gaining foothold", "escalating access", "objective in reach"];

export function CareerQuiz({ initialQuestion }: { initialQuestion?: number }) {
  const router = useRouter();
  /*
   * Opening the questionnaire is a fresh start: any earlier answers in this
   * tab are cleared. Reloading the page keeps them, and the review links
   * (?question=N) keep them too. Done during the first render so the old
   * question never flashes on screen.
   */
  useState(() => {
    if (typeof window === "undefined") return "server";
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const reloaded = navigation?.type === "reload";
    if (!reloaded && !initialQuestion) clearAttempt();
    return reloaded ? "resumed" : "fresh";
  });
  const stored = useAttempt();
  const attempt: Attempt = stored === LOADING || stored === null ? emptyAttempt() : stored;
  const [notice, setNotice] = useState<{ kind: "limit" | "required"; question: string } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const hintId = useId();
  const noticeId = useId();
  const movedByStudent = useRef(false);

  // "Review My Answers" and "Revisit skipped questions" link to a specific question.
  useEffect(() => {
    if (stored === LOADING || !initialQuestion) return;
    const position = Math.min(Math.max(initialQuestion, 1), TOTAL) - 1;
    saveAttempt({ ...(stored ?? emptyAttempt()), position });
    movedByStudent.current = true;
    router.replace("/careers/quiz", { scroll: false });
    // Only apply the link once, when storage first becomes readable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stored === LOADING]);

  const position = attempt.position;
  const question = QUESTIONS[position];
  const answer = attempt.answers[question.id];
  const chosen = answer?.kind === "choices" ? answer.optionIds : [];
  const unsure = answer?.kind === "unsure";
  const isLast = position === TOTAL - 1;
  const activeNotice = notice?.question === question.id ? notice : null;

  // Move focus to the new question so keyboard and screen reader users start at the top of it.
  useEffect(() => {
    if (!movedByStudent.current) return;
    movedByStudent.current = false;
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.closest("section")?.scrollIntoView({ block: "start", behavior: "auto" });
  }, [position]);

  function update(next: Partial<Attempt>) {
    saveAttempt({ ...attempt, ...next });
  }

  function setAnswer(answer: Attempt["answers"][string] | undefined) {
    const answers = withAnswer(attempt, question.id, answer);
    // A finished attempt stays finished while every question still has an answer,
    // so reviewing and changing one answer does not mean clicking through again.
    update({ answers, finished: attempt.finished && QUESTIONS.every((q) => isAnswered(answers[q.id])) });
  }

  function choose(optionId: string) {
    const result = toggleChoice(answer, optionId);
    if (result.limitReached) {
      setNotice({ kind: "limit", question: question.id });
      return;
    }
    setNotice(null);
    setAnswer(result.answer);
  }

  function chooseUnsure() {
    setNotice(null);
    setAnswer(toggleUnsure(answer));
  }

  function goTo(nextPosition: number) {
    setNotice(null);
    movedByStudent.current = true;
    update({ position: nextPosition });
  }

  function onContinue(event: FormEvent) {
    event.preventDefault();
    if (!isAnswered(answer)) {
      setNotice({ kind: "required", question: question.id });
      return;
    }
    if (isLast) {
      saveAttempt({ ...attempt, finished: true });
      router.push("/careers/results");
      return;
    }
    goTo(position + 1);
  }

  if (stored === LOADING) {
    return <p className="py-16 text-muted" aria-live="polite">Loading the questionnaire…</p>;
  }

  return (
    <section className="careers-quiz" aria-labelledby="quiz-question">
      <div className="careers-quiz-shell">
        <div className="careers-quiz-top">
          <p className="careers-progress-label" id="quiz-position">
            Question <strong>{position + 1}</strong> of {TOTAL}
          </p>
          <div
            className="careers-progress-track"
            role="progressbar"
            aria-label="Questionnaire progress"
            aria-valuemin={1}
            aria-valuemax={TOTAL}
            aria-valuenow={position + 1}
            aria-valuetext={`Question ${position + 1} of ${TOTAL}`}
          >
            <div className="careers-progress-fill" style={{ width: `${((position + 1) / TOTAL) * 100}%` }} />
          </div>
          <p className="careers-breach" aria-hidden="true">
            <Skull className="size-4" />
            <span>{STAGES[Math.min(STAGES.length - 1, Math.floor((position / TOTAL) * STAGES.length))]}</span>
            <strong>{Math.round(((position + 1) / TOTAL) * 100)}%</strong>
          </p>
        </div>

        <form className="careers-quiz-body" onSubmit={onContinue} noValidate>
          {/*
            * A labelled group rather than a fieldset: a legend is not a flex
            * item, so it cannot be centered on the screen with its answers.
            */}
          <div className="careers-quiz-group" role="group" aria-labelledby="quiz-position quiz-question" aria-describedby={cn(hintId, activeNotice && noticeId)}>
            <h2 id="quiz-question" ref={headingRef} tabIndex={-1} className="careers-question" data-question={question.id}>
              <ScrambleText key={question.id} text={question.prompt} speed={9} />
            </h2>
            <p id={hintId} className="careers-hint">
              Choose up to two answers, or select “Not sure yet.”{" "}
              <span className="careers-hint-count">
                {unsure ? "“Not sure yet” selected." : `${chosen.length} of ${MAX_CHOICES} chosen.`}
              </span>
            </p>

            <div className="careers-options">
              {question.options.map((option, index) => {
                const checked = chosen.includes(option.id);
                return (
                  <label key={option.id} className="careers-option" data-checked={checked}>
                    <input type="checkbox" className="careers-option-input" checked={checked} onChange={() => choose(option.id)} />
                    <span className="careers-option-key" aria-hidden="true">
                      {LETTERS[index]}
                    </span>
                    <span className="careers-option-text">{option.text}</span>
                    <span className="careers-option-check" aria-hidden="true">
                      {checked ? <Check className="size-3.5" strokeWidth={3.5} /> : null}
                    </span>
                  </label>
                );
              })}
            </div>

            <label className="careers-option careers-option-unsure" data-checked={unsure}>
              <input type="checkbox" className="careers-option-input" checked={unsure} onChange={chooseUnsure} />
              <span className="careers-option-key" aria-hidden="true">
                <HelpCircle className="size-4" />
              </span>
              <span className="careers-option-text">Not sure yet</span>
              <span className="careers-option-check" aria-hidden="true">
                {unsure ? <Check className="size-3.5" strokeWidth={3.5} /> : null}
              </span>
            </label>

            <div id={noticeId} className="careers-notice">
              <p role="status">
                {activeNotice?.kind === "limit" ? "You’ve already chosen two answers. Unselect one of them to choose a different answer." : null}
              </p>
              <p role="alert">
                {activeNotice?.kind === "required" ? "Choose at least one answer, or select “Not sure yet,” to continue." : null}
              </p>
            </div>
          </div>

          <div className="careers-quiz-actions">
            <Button type="button" variant="outline" onClick={() => goTo(position - 1)} disabled={position === 0}>
              <ArrowLeft className="size-4" aria-hidden /> Back
            </Button>
            {stored?.finished ? (
              <Link href="/careers/results" className="careers-quiz-jump">
                See My Matches
              </Link>
            ) : (
              <p className="careers-quiz-privacy">Answers stay in this browser tab.</p>
            )}
            <Button type="submit">
              {isLast ? "See My Matches" : "Continue"} <ArrowRight className="size-4" aria-hidden />
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}

function withAnswer(attempt: Attempt, questionId: string, answer: Attempt["answers"][string] | undefined) {
  const answers = { ...attempt.answers };
  if (answer) answers[questionId] = answer;
  else delete answers[questionId];
  return answers;
}
