/**
 * What runs inside the data cache: fetch the sheet, parse it, log what was
 * skipped. It also owns the resilience rules, because the cache calls it
 * again on every request once an entry is stale:
 *
 * - After a failure it refuses to call Google again for 30 seconds.
 * - After a good read it keeps that list and serves it through an outage
 *   instead of throwing, so the cache is refilled with known-good data.
 * - A sheet that cannot be read at all (no usable header) is a failure.
 *
 * `fetchValues`, the clock and the logger are injected so all of this is
 * unit tested without Next.js or the network.
 */
import { createHash } from "node:crypto";
import type { ClubEvent } from "@/lib/events/event";
import { parseSheet } from "@/lib/events/sheet";

export const RETRY_AFTER_MS = 30_000;

export type ReaderLog = { info: (message: string) => void; warn: (message: string) => void; error: (message: string) => void };

export type ReaderDeps = {
  fetchValues: () => Promise<unknown[][]>;
  timeZone: string;
  /** How the sheet is named in logs: never its full ID. */
  label: string;
  now?: () => number;
  log?: ReaderLog;
  retryAfterMs?: number;
};

/** Thrown instead of calling Google while a recent failure is still fresh. */
export class BackoffError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BackoffError";
  }
}

export function describeError(err: unknown): string {
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return message.slice(0, 200);
}

/** A cache key part that separates sheets and tabs without carrying the spreadsheet ID. */
export function sheetCacheKey(spreadsheetId: string, range: string): string {
  return createHash("sha256").update(`${spreadsheetId}\n${range}`).digest("hex").slice(0, 16);
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
      throw new BackoffError("Not retrying the events sheet yet after a recent failure");
    }
    try {
      const values = await deps.fetchValues();
      const { events, problems } = parseSheet(values, { timeZone: deps.timeZone });
      for (const p of problems) log.warn(`[events] sheet ${deps.label} row ${p.row}${p.field ? ` ${p.field}` : ""}: ${p.message}`);
      log.info(`[events] read ${events.length} published event(s) from sheet ${deps.label}`);
      lastGood = events;
      lastFailureAt = null;
      return events;
    } catch (err) {
      lastFailureAt = now();
      log.error(`[events] could not load the events sheet ${deps.label}: ${describeError(err)}`);
      if (lastGood) {
        log.warn(`[events] serving the last good list of ${lastGood.length} event(s) until the sheet can be read again`);
        return lastGood;
      }
      throw err;
    }
  };
}
