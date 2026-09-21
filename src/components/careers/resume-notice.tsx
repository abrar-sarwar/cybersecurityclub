"use client";

import Link from "next/link";
import { LOADING, useAttempt } from "./attempt-store";

/** On the landing page, links back to results from a finished attempt in this tab. */
export function ResumeNotice() {
  const attempt = useAttempt();
  if (attempt === LOADING || !attempt) return null;
  if (!attempt.finished) return null;
  return (
    <p className="careers-resume-notice" role="status">
      You finished the questionnaire in this tab.{" "}
      <Link href="/careers/results" className="careers-inline-link">
        See My Matches
      </Link>
    </p>
  );
}
