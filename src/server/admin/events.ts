import "server-only";
import { branding } from "@config/branding";
import type { ClubEvent } from "@/lib/events/event";
import { cleanText, normaliseHeader, parseSheet, type SheetProblem, SheetStructureError } from "@/lib/events/sheet";
import { describeError } from "@/server/events/events-reader";
import { readSheetsConfig } from "@/server/events/google-sheets";
import { createSheetWriter, type SheetWriter } from "@/server/events/sheet-writer";

/**
 * The admin page's view of the sheet: always fresh, every row including
 * hidden ones, plus the raw cells so an edit can write a whole row back.
 */
export type AdminSheet = { header: unknown[]; rows: unknown[][]; events: ClubEvent[]; problems: SheetProblem[]; takenIds: string[] };
export type AdminSheetResult = { ok: true; sheet: AdminSheet } | { ok: false; reason: "unconfigured" | "unavailable"; detail?: string };

let writer: SheetWriter | null | undefined;

export function getSheetWriter(): SheetWriter | null {
  if (writer !== undefined) return writer;
  const setup = readSheetsConfig();
  writer = setup.ok ? createSheetWriter(setup.config) : null;
  return writer;
}

export async function readAdminSheet(): Promise<AdminSheetResult> {
  const current = getSheetWriter();
  if (!current) return { ok: false, reason: "unconfigured" };
  try {
    const { header, rows } = await current.readAll();
    const { events, problems } = parseSheet([header, ...rows], { timeZone: branding.timezone, includeUnpublished: true });
    const idColumn = header.findIndex((cell) => normaliseHeader(cell) === "event_id");
    const takenIds = idColumn < 0 ? [] : rows.map((row) => cleanText(row[idColumn])).filter(Boolean);
    return { ok: true, sheet: { header, rows, events, problems, takenIds } };
  } catch (err) {
    if (err instanceof SheetStructureError) return { ok: false, reason: "unavailable", detail: err.message };
    console.error(`[admin] could not read the sheet: ${describeError(err)}`);
    return { ok: false, reason: "unavailable" };
  }
}
