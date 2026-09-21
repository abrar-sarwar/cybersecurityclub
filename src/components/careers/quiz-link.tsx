"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { clearAttempt } from "./attempt-store";

/**
 * Starts the questionnaire from question one. Opening it is always a fresh
 * run, so any answers still held in this browser tab are cleared first.
 */
export function QuizLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Link href="/careers/quiz" className={className} onClick={() => clearAttempt()}>
      {children}
    </Link>
  );
}
