import "server-only";
import { branding } from "@config/branding";
import { eventFromRow } from "@/lib/events/db-row";
import type { ClubEvent } from "@/lib/events/event";
import { describeError } from "@/server/events/events-reader";
import { createSupabaseClient, readSupabaseConfig, type SupabaseClient } from "@/server/events/supabase";

/** The admin page's view: always fresh, every row including hidden ones, plus the ids already in use. */
export type AdminEventsResult = { ok: true; events: ClubEvent[]; problems: string[]; takenIds: string[] } | { ok: false; reason: "unconfigured" | "unavailable" };

let client: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const setup = readSupabaseConfig();
  client = setup.ok ? createSupabaseClient(setup.config) : null;
  return client;
}

export async function readAdminEvents(): Promise<AdminEventsResult> {
  const current = getSupabaseClient();
  if (!current) return { ok: false, reason: "unconfigured" };
  try {
    const rows = await current.listEvents({ onlyPublished: false });
    const events: ClubEvent[] = [];
    const problems: string[] = [];
    const takenIds: string[] = [];
    for (const row of rows) {
      const id = row && typeof row === "object" && typeof (row as { id?: unknown }).id === "string" ? (row as { id: string }).id : null;
      if (id) takenIds.push(id);
      const result = eventFromRow(row, branding.timezone);
      if (result.ok) {
        events.push(result.event);
        problems.push(...result.warnings);
      } else problems.push(result.problem);
    }
    return { ok: true, events, problems, takenIds };
  } catch (err) {
    console.error(`[admin] could not read the events table: ${describeError(err)}`);
    return { ok: false, reason: "unavailable" };
  }
}
