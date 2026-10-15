import "server-only";
import { unstable_cache } from "next/cache";
import { branding } from "@config/branding";
import type { ClubEvent } from "@/lib/events/event";
import { BackoffError, createEventsReader, describeError, sheetCacheKey } from "./events-reader";
import { createSheetsClient, readSheetsConfig } from "./google-sheets";

/**
 * The one place the site gets events from. The reader (see events-reader.ts)
 * fetches, parses, backs off after failures and serves its last good list
 * through an outage; this module wraps it in the Next.js data cache,
 * revalidated every EVENTS_CACHE_SECONDS, and turns the outcome into a
 * result the page can render. Never throws.
 */
export type EventsResult = { ok: true; events: ClubEvent[] } | { ok: false; reason: "unconfigured" | "unavailable" };

type State = { read: () => Promise<ClubEvent[]> } | null;

let state: State | undefined;
let inflight: Promise<ClubEvent[]> | null = null;

/** Built on first use so the env is read at request time, not at build time. */
function getState(): State {
  if (state !== undefined) return state;
  const setup = readSheetsConfig();
  if (!setup.ok) {
    console.warn(`[events] Google Sheets is not configured; missing ${setup.missing.join(", ")}. The events page will show the unavailable state.`);
    return (state = null);
  }
  const { config } = setup;
  const client = createSheetsClient(config);
  const reader = createEventsReader({ fetchValues: () => client.fetchValues(), timeZone: branding.timezone, label: `${config.spreadsheetId.slice(0, 6)}…` });
  // The key names the sheet and tab (hashed) so a different sheet never serves another's cached entry.
  const read = unstable_cache(reader, ["events-sheet", sheetCacheKey(config.spreadsheetId, config.range)], { revalidate: config.cacheSeconds, tags: ["events"] });
  return (state = { read });
}

export async function loadEvents(): Promise<EventsResult> {
  const current = getState();
  if (!current) return { ok: false, reason: "unconfigured" };
  try {
    // Concurrent cache misses share one read.
    if (!inflight) {
      inflight = current.read().finally(() => {
        inflight = null;
      });
    }
    return { ok: true, events: await inflight };
  } catch (err) {
    // The reader has already logged a real failure; a backoff is expected and quiet.
    if (!(err instanceof BackoffError)) console.error(`[events] showing the unavailable notice: ${describeError(err)}`);
    return { ok: false, reason: "unavailable" };
  }
}
