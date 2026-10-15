import "server-only";
import { unstable_cache } from "next/cache";
import { branding } from "@config/branding";
import { eventFromRow } from "@/lib/events/db-row";
import type { ClubEvent } from "@/lib/events/event";
import { BackoffError, createEventsReader, describeError, storeCacheKey } from "./events-reader";
import { createSupabaseClient, readSupabaseConfig } from "./supabase";

/**
 * The one place the public site gets events from. The reader (events-reader.ts)
 * fetches, backs off after failures and serves its last good list through an
 * outage; this module wraps it in the Next.js data cache, revalidated every
 * EVENTS_CACHE_SECONDS or at once when the admin page saves, and turns the
 * outcome into a result the page can render. Never throws.
 */
export type EventsResult = { ok: true; events: ClubEvent[] } | { ok: false; reason: "unconfigured" | "unavailable" };

type State = { read: () => Promise<ClubEvent[]> } | null;

let state: State | undefined;
let inflight: Promise<ClubEvent[]> | null = null;

/** Built on first use so the env is read at request time, not at build time. */
function getState(): State {
  if (state !== undefined) return state;
  const setup = readSupabaseConfig();
  if (!setup.ok) {
    console.warn(`[events] Supabase is not configured; missing ${setup.missing.join(", ")}. The events page will show the unavailable state.`);
    return (state = null);
  }
  const { config } = setup;
  const client = createSupabaseClient(config);
  const reader = createEventsReader({
    label: "the events table",
    async fetchEvents() {
      const events: ClubEvent[] = [];
      const problems: string[] = [];
      for (const row of await client.listEvents({ onlyPublished: true })) {
        const result = eventFromRow(row, branding.timezone);
        if (result.ok) events.push(result.event);
        else problems.push(result.problem);
      }
      return { events, problems };
    },
  });
  const read = unstable_cache(reader, ["events-db", storeCacheKey(config.url)], { revalidate: config.cacheSeconds, tags: ["events"] });
  return (state = { read });
}

export async function loadEvents(): Promise<EventsResult> {
  const current = getState();
  if (!current) return { ok: false, reason: "unconfigured" };
  try {
    if (!inflight) {
      inflight = current.read().finally(() => {
        inflight = null;
      });
    }
    return { ok: true, events: await inflight };
  } catch (err) {
    if (!(err instanceof BackoffError)) console.error(`[events] showing the unavailable notice: ${describeError(err)}`);
    return { ok: false, reason: "unavailable" };
  }
}
