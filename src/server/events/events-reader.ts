/**
 * What runs inside the data cache: fetch the published events, log what was
 * skipped. It also owns the resilience rules, because the cache calls it
 * again on every request once an entry is stale:
 *
 * - After a failure it refuses to call the store again for 30 seconds.
 * - After a good read it keeps that list and serves it through an outage
 *   instead of throwing, so the cache is refilled with known-good data.
 *
 * `fetchEvents`, the clock and the logger are injected so all of this is
 * unit tested without Next.js or the network.
 */
import { createHash } from "node:crypto";
import type { ClubEvent } from "@/lib/events/event";

export const RETRY_AFTER_MS = 30_000;

export type ReaderLog = { info: (message: string) => void; warn: (message: string) => void; error: (message: string) => void };

export type ReaderDeps = {
  /** Reads the store and maps rows; rows it could not read come back as problems. */
  fetchEvents: () => Promise<{ events: ClubEvent[]; problems: string[] }>;
  /** How the store is named in logs. */
  label: string;
  now?: () => number;
  log?: ReaderLog;
  retryAfterMs?: number;
};

/** Thrown instead of calling the store while a recent failure is still fresh. */
export class BackoffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackoffError";
  }
}

export function describeError(err: unknown): string {
  let message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  const cause = err instanceof Error ? (err as { cause?: unknown }).cause : undefined;
  if (cause instanceof Error) message += ` (cause: ${[(cause as { code?: string }).code, cause.message].filter(Boolean).join(" ")})`;
  return message.slice(0, 240);
}

/** A cache key part that separates stores without carrying their address. */
export function storeCacheKey(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

export function createEventsReader(deps: ReaderDeps): () => Promise<ClubEvent[]> {
  const now = deps.now ?? Date.now;
  const log: ReaderLog = deps.log ?? console;
  const retryAfterMs = deps.retryAfterMs ?? RETRY_AFTER_MS;
  let lastGood: ClubEvent[] | null = null;
  let lastFailureAt: number | null = null;

  return async function readEvents(): Promise<ClubEvent[]> {
    if (lastFailureAt !== null && now() - lastFailureAt < retryAfterMs) {
      if (lastGood) return lastGood;
      throw new BackoffError("Not retrying the events store yet after a recent failure");
    }
    try {
      const { events, problems } = await deps.fetchEvents();
      for (const problem of problems) log.warn(`[events] ${deps.label}: ${problem}`);
      log.info(`[events] read ${events.length} published event(s) from ${deps.label}`);
      lastGood = events;
      lastFailureAt = null;
      return events;
    } catch (err) {
      lastFailureAt = now();
      log.error(`[events] could not load events from ${deps.label}: ${describeError(err)}`);
      if (lastGood) {
        log.warn(`[events] serving the last good list of ${lastGood.length} event(s) until ${deps.label} can be read again`);
        return lastGood;
      }
      throw err;
    }
  };
}
