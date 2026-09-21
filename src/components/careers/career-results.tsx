"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CAREER_BY_ID, CAREER_PATHS } from "@/content/careers/paths";
import { QUESTIONS } from "@/content/careers/questions";
import { rankMatches, type Match } from "@/lib/careers/scoring";
import { Button, ButtonLink } from "@/components/ui/button";
import { LOADING, clearAttempt, useAttempt } from "./attempt-store";
import { CareerList } from "./career-list";
import { QuizLink } from "./quiz-link";
import { ScrambleText } from "./scramble-text";

const questionNumber = (questionId: string) => QUESTIONS.findIndex((q) => q.id === questionId) + 1;

/** Lines shown while the answers are scored, then replaced by the ranking. */
const SCAN_LINES = [
  "reading responses",
  "weighting answers by path",
  "normalising across 12 paths",
  "ranking matches",
];

export function CareerResults() {
  const router = useRouter();
  const stored = useAttempt();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const loading = stored === LOADING;

  // Arriving from the last question (or directly), start reading at the heading.
  useEffect(() => {
    if (loading) return;
    if (!document.activeElement || document.activeElement === document.body) headingRef.current?.focus({ preventScroll: true });
  }, [loading]);

  function retake() {
    clearAttempt();
    router.push("/careers/quiz");
  }

  if (stored === LOADING) {
    return <p className="py-16 text-muted" aria-live="polite">Loading your results…</p>;
  }

  if (!stored || !stored.finished) {
    const started = Boolean(stored && Object.keys(stored.answers).length);
    return (
      <Intro
        headingRef={headingRef}
        title={started ? "Finish the questionnaire to see your matches" : "No questionnaire answers in this session"}
        description={
          started
            ? "You have answered some questions in this browser tab. Pick up where you left off, or browse every path now."
            : "Results come from answers saved in this browser tab, and closing the tab clears them. Take the questionnaire to see your starting points, or browse every path without it."
        }
      >
        {started ? (
          <ButtonLink href="/careers/quiz" size="lg">
            Continue the Questionnaire
          </ButtonLink>
        ) : (
          <QuizLink className="btn-cyber btn-cyber-primary btn-cyber-lg">Find My Path</QuizLink>
        )}
        <ButtonLink href="/careers#paths" variant="outline" size="lg">
          Explore All Paths
        </ButtonLink>
      </Intro>
    );
  }

  const result = rankMatches(QUESTIONS, stored.answers);
  const firstSkipped = result.unsureQuestionIds[0];

  return (
    <>
      {result.kind === "exploring" ? (
        <Intro
          headingRef={headingRef}
          title="You’re still exploring"
          description="You chose “Not sure yet” for every question, which is a perfectly good place to start. Browse the paths below, open any that sound interesting, and come back to the questionnaire whenever you like."
        />
      ) : result.kind === "broad" ? (
        <Intro
          headingRef={headingRef}
          title="Your interests are broad"
          description="Your answers pointed equally toward all twelve paths, so there is no single starting point to recommend. You can start with whichever path sounds most interesting and change direction whenever you want."
        />
      ) : (
        <Intro
          headingRef={headingRef}
          title="Your cybersecurity starting points"
          description="Ranked by the work you selected. Match shows how much of each path’s work you picked. It is not a skill score or a prediction."
          aside={<ResultSummary matches={result.matches} />}
        />
      )}

      {result.kind !== "exploring" && result.early ? (
        <div className="careers-callout" role="note">
          <p className="font-semibold text-navy-900">Early suggestions</p>
          <p className="mt-1">
            You picked a specific answer on {result.substantiveCount} of {QUESTIONS.length} questions, so treat these as early suggestions. Revisiting the questions you marked “Not sure yet” will give them more to go on.
          </p>
          {firstSkipped ? (
            <Link href={`/careers/quiz?question=${questionNumber(firstSkipped)}`} className="careers-inline-link mt-2 inline-flex">
              Revisit skipped questions
            </Link>
          ) : null}
        </div>
      ) : null}

      {result.kind !== "matches" ? (
        <section className="careers-section" aria-labelledby="all-paths-heading">
          <h2 id="all-paths-heading" className="careers-section-title">
            All twelve paths
          </h2>
          <CareerList paths={CAREER_PATHS} />
        </section>
      ) : null}

      <nav className="careers-result-actions" aria-label="Questionnaire options">
        <Button size="lg" onClick={retake}>
          Retake the Questionnaire
        </Button>
      </nav>
    </>
  );
}

function Intro({
  headingRef,
  title,
  description,
  children,
  aside,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  title: string;
  description: string;
  children?: ReactNode;
  /** Sits at the top right, visible without scrolling. */
  aside?: ReactNode;
}) {
  return (
    <header className="careers-results-intro">
      {aside}
      <p className="eyebrow mb-3">Career exploration</p>
      <h1 ref={headingRef} tabIndex={-1} className="careers-page-title">
        {title}
      </h1>
      <p className="careers-lead">{description}</p>
      {children ? <div className="mt-7 flex flex-wrap gap-3">{children}</div> : null}
    </header>
  );
}

/**
 * The whole ranking in one panel: position, path, match bar and percentage.
 * Each row links to the path, so there is nothing to scroll past.
 */
function ResultSummary({ matches }: { matches: Match[] }) {
  // Reduced motion skips the scan and shows the ranking straight away.
  const [scanning, setScanning] = useState(
    () => typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [line, setLine] = useState(0);

  useEffect(() => {
    if (!scanning) return;
    const steps = SCAN_LINES.map((_, index) => window.setTimeout(() => setLine(index), index * 170));
    const done = window.setTimeout(() => setScanning(false), SCAN_LINES.length * 170 + 140);
    return () => {
      steps.forEach(window.clearTimeout);
      window.clearTimeout(done);
    };
    // Runs once: the scan is an intro, not a reaction to later state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <aside className="careers-summary" aria-label="Your matches">
      <p className="careers-summary-title">Your results</p>
      {scanning ? (
        <ol className="careers-scan-lines" aria-hidden="true">
          {SCAN_LINES.slice(0, line + 1).map((text) => (
            <li key={text}>
              <span className="careers-scan-prompt">&gt;</span> {text}
              <span className="careers-scan-caret" />
            </li>
          ))}
        </ol>
      ) : (
        <>
          <ol className="careers-summary-list">
            {matches.map((match, index) => {
              const path = CAREER_BY_ID[match.path];
              return (
                <li key={match.path} className="careers-summary-row" style={{ "--rank-index": index } as React.CSSProperties}>
                  <span className="careers-summary-rank" aria-hidden="true">
                    {index + 1}
                  </span>
                  <Link href={`/careers/${path.slug}`} className="careers-summary-link">
                    <ScrambleText text={path.name} delay={index * 80} />
                  </Link>
                  <span className="careers-summary-percent">{match.percent}%</span>
                  <span
                    className="careers-summary-bar"
                    role="progressbar"
                    aria-label={`${path.name} match`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={match.percent}
                  >
                    <span className="careers-summary-fill" style={{ width: `${match.percent}%` }} />
                  </span>
                  {match.equallyMatched ? <span className="careers-summary-tie">Equally matched</span> : null}
                </li>
              );
            })}
          </ol>
          <p className="careers-summary-hint">Click a path to learn more.</p>
        </>
      )}
    </aside>
  );
}

