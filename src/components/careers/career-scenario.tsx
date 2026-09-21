"use client";

import { useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { CAREER_SCENARIOS, type ScenarioVerdict } from "@/content/careers/scenarios";
import type { CareerId } from "@/content/careers/types";
import { Button, ButtonLink } from "@/components/ui/button";

const VERDICTS: Record<ScenarioVerdict, string> = {
  strong: "What most people would do",
  workable: "Workable",
  risky: "Risky",
};

/**
 * A short decision walkthrough of the work. Nothing is scored: each choice
 * explains what would happen, so the student can talk about the reasoning
 * afterwards.
 */
export function CareerScenario({ path, projectTitle }: { path: CareerId; projectTitle: string }) {
  const scenario = CAREER_SCENARIOS[path];
  const [picks, setPicks] = useState<(string | null)[]>(() => scenario.steps.map(() => null));
  const answered = picks.filter(Boolean).length;
  const done = answered === scenario.steps.length;

  return (
    <div className="scenario">
      <div className="scenario-message">
        <p className="scenario-meta">
          <Mail className="size-4" aria-hidden /> From: {scenario.from}
        </p>
        <h3 className="scenario-subject">{scenario.subject}</h3>
        <p className="scenario-setup">{scenario.setup}</p>
      </div>

      <ol className="scenario-steps">
        {scenario.steps.map((step, stepIndex) => {
          const locked = stepIndex > 0 && !picks[stepIndex - 1];
          const picked = picks[stepIndex];
          const chosen = step.options.find((option) => option.id === picked);
          return (
            <li key={step.prompt} className="scenario-step" data-locked={locked} data-answered={Boolean(picked)}>
              <p className="scenario-prompt">
                <span className="scenario-step-number" aria-hidden="true">
                  {stepIndex + 1}
                </span>
                {step.prompt}
              </p>
              {locked ? (
                <p className="scenario-locked">Choose above to continue.</p>
              ) : (
                <>
                  <ul className="scenario-options">
                    {step.options.map((option) => (
                      <li key={option.id}>
                        <button
                          type="button"
                          className="scenario-option"
                          data-picked={picked === option.id}
                          aria-pressed={picked === option.id}
                          onClick={() =>
                            setPicks((current) => current.map((value, index) => (index === stepIndex ? option.id : value)))
                          }
                        >
                          {option.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="scenario-outcome" role="status">
                    {chosen ? (
                      <>
                        <p className="scenario-verdict" data-verdict={chosen.verdict}>
                          {VERDICTS[chosen.verdict]}
                        </p>
                        <p>{chosen.outcome}</p>
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ol>

      {done ? (
        <div className="scenario-takeaway">
          <p className="careers-label">What you just practised</p>
          <p className="mt-2 leading-7 text-ink">{scenario.takeaway}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href="#project" variant="secondary">
              Do it for real: {projectTitle} <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            <Button variant="ghost" onClick={() => setPicks(scenario.steps.map(() => null))}>
              Start over
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
