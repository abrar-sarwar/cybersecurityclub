import "server-only";
import { unstable_cache } from "next/cache";
import { branding } from "@config/branding";
import type { ClubEvent } from "@/lib/events/event";
import { parseSheet } from "@/lib/events/sheet";
import { createSheetsClient, readSheetsConfig } from "./google-sheets";

/**
 * The one place the site gets events from. Reads the sheet through the data
 * cache (revalidated every EVENTS_CACHE_SECONDS), keeps the last good list
 * in memory for when Google is down, and backs off for 30 seconds after a
 * failure so a Google outage does not turn every page view into a retry.
 * Never throws: the page decides what to show for each result.
 */
export type EventsResult = { ok: true; events: ClubEvent[] } | { ok: false; reason: "unconfigured" | "unavailable" };

const RETRY_AFTER_MS = 30_000;

type State = { read: () => Promise<ClubEvent[]> } | null;

let state: State | undefined;
let lastGood: ClubEvent[] | null = null;
let lastFailureAt = 0;
let inflight: Promise<ClubEvent[]> | null = null;

function describe(err: unknown): string {
  const message = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  return message.slice(0, 200);
}

/** Built on first use so the env is read at request time, not at build time. */
function getState(): State {
  if (state !== undefined) return state;
  const setup = readSheetsConfig();
  if (!setup.ok) {
    console.warn(`[events] Google Sheets is not configured; missing ${setup.missing.join(", ")}. The events page will show the unavailable state.`);
    return (state = null);
  }
  const client = createSheetsClient(setup.config);
  const sheetTag = setup.config.spreadsheetId.slice(0, 6);
  const read = unstable_cache(
    async () => {
      const values = await client.fetchValues();
      const { events, problems } = parseSheet(values, { timeZone: branding.timezone });
      for (const p of problems) console.warn(`[events] sheet ${sheetTag}… row ${p.row}${p.field ? ` ${p.field}` : ""}: ${p.message}`);
      console.info(`[events] read ${events.length} published event(s) from sheet ${sheetTag}…`);
      return events;
    },
    ["events-sheet"],
    { revalidate: setup.config.cacheSeconds, tags: ["events"] },
  );
  return (state = { read });
}

export async function loadEvents(): Promise<EventsResult> {
  const current = getState();
  if (!current) return { ok: false, reason: "unconfigured" };
  const fallback = (): EventsResult => (lastGood ? { ok: true, events: lastGood } : { ok: false, reason: "unavailable" });
  if (Date.now() - lastFailureAt < RETRY_AFTER_MS) return fallback();
  try {
    if (!inflight) {
      inflight = current.read().finally(() => {
        inflight = null;
      });
    }
    const events = await inflight;
    lastGood = events;
    lastFailureAt = 0;
    return { ok: true, events };
  } catch (err) {
    lastFailureAt = Date.now();
    console.error(`[events] could not load the events sheet: ${describe(err)}`);
    return fallback();
  }
}
