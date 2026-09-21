"use client";

import { useSyncExternalStore } from "react";
import { QUESTIONS } from "@/content/careers/questions";
import { sanitizeAnswers, type Answer } from "@/lib/careers/answers";

/**
 * The questionnaire attempt lives only in this browser tab's session storage:
 * it survives a refresh, disappears when the tab closes, and is never sent to
 * a server.
 */
export const ATTEMPT_STORAGE_KEY = "cyber-careers-attempt";
const CHANGE_EVENT = "cyber-careers-attempt-change";

export type Attempt = {
  version: 1;
  answers: Record<string, Answer>;
  /** Zero-based index of the question on screen. */
  position: number;
  /** Set when the student pressed "See My Matches". */
  finished: boolean;
};

/** Returned during server rendering and hydration, before storage can be read. */
export const LOADING = "loading" as const;

export function emptyAttempt(): Attempt {
  return { version: 1, answers: {}, position: 0, finished: false };
}

let cachedRaw: string | null | undefined;
let cachedAttempt: Attempt | null = null;
/** Used instead of session storage when the browser blocks it, for this page view only. */
let memoryRaw: string | null = null;
let storageBlocked = false;

function parse(raw: string | null): Attempt | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Attempt>;
    if (value?.version !== 1) return null;
    const position = Number.isInteger(value.position) ? Math.min(Math.max(value.position!, 0), QUESTIONS.length - 1) : 0;
    return { version: 1, answers: sanitizeAnswers(QUESTIONS, value.answers), position, finished: value.finished === true };
  } catch {
    return null;
  }
}

function readRaw() {
  if (storageBlocked) return memoryRaw;
  try {
    return window.sessionStorage.getItem(ATTEMPT_STORAGE_KEY);
  } catch {
    storageBlocked = true;
    return memoryRaw;
  }
}

function writeRaw(raw: string | null) {
  memoryRaw = raw;
  if (storageBlocked) return;
  try {
    if (raw === null) window.sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
    else window.sessionStorage.setItem(ATTEMPT_STORAGE_KEY, raw);
  } catch {
    storageBlocked = true;
  }
}

function getSnapshot(): Attempt | null {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedAttempt = parse(raw);
  }
  return cachedAttempt;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => window.removeEventListener(CHANGE_EVENT, onChange);
}

export function saveAttempt(attempt: Attempt) {
  writeRaw(JSON.stringify(attempt));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function clearAttempt() {
  writeRaw(null);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** The current attempt, `null` when there is none, or LOADING before hydration. */
export function useAttempt(): Attempt | null | typeof LOADING {
  return useSyncExternalStore<Attempt | null | typeof LOADING>(subscribe, getSnapshot, () => LOADING);
}
