/**
 * The `events` table's rows, to and from the site's event model. Reading a
 * row runs it through the same rules as the admin form (`parseSheet` on one
 * synthetic row), so a row edited by hand in the Supabase dashboard is held
 * to the same standard and skipped, with a reason, when it fails.
 */
import type { ClubEvent, EventLink } from "./event";
import { type EventCells, KNOWN_HEADERS } from "./form";
import { parseLinks } from "./links";
import { parseSheet } from "./sheet";

export type EventRow = {
  id: string;
  title: string;
  description: string;
  /** YYYY-MM-DD. */
  date: string;
  /** HH:mm in the club's timezone, or null. */
  start_time: string | null;
  end_time: string | null;
  location: string;
  category: string;
  image_url: string;
  image_alt: string;
  registration_url: string;
  status: string;
  published: boolean;
  /** One of EVENT_DIFFICULTIES or empty. */
  difficulty: string;
  luma_event_id: string;
  /** jsonb: `[{ label, href }]`. */
  links: EventLink[];
  image_width: number | null;
  image_height: number | null;
};

export const EVENT_COLUMNS = ["id", "title", "description", "date", "start_time", "end_time", "location", "category", "image_url", "image_alt", "registration_url", "status", "published", "difficulty", "luma_event_id", "links", "image_width", "image_height"] as const satisfies readonly (keyof EventRow)[];

/**
 * A row as an event. A row the rules skip (bad id, title or date) is rejected
 * with a reason. A row with a bad optional field keeps the event, loses that
 * field, and carries a warning, so officers can still open and fix it.
 */
export function eventFromRow(row: unknown, timeZone: string): { ok: true; event: ClubEvent; warnings: string[] } | { ok: false; problem: string } {
  if (!row || typeof row !== "object") return { ok: false, problem: "Not a row" };
  const r = row as Record<string, unknown>;
  const label = typeof r.id === "string" && r.id ? r.id : "(no id)";
  const header = [...KNOWN_HEADERS];
  const cells = header.map((h) => (h === "event_id" ? r.id : r[h]) ?? "");
  const parsed = parseSheet([header, cells], { timeZone, includeUnpublished: true });
  const notes = parsed.problems.map((p) => `${label} ${p.field ?? "row"}: ${p.message}`);
  if (parsed.events.length === 1) return { ok: true, event: parsed.events[0], warnings: notes };
  return { ok: false, problem: notes.join("; ") || `${label} could not be read` };
}

/** The validated form cells as a table row: real booleans and numbers, lower-case status, null for empty times, materials as an array. */
export function rowFromCells(cells: EventCells): EventRow {
  const px = (s: string) => (s ? Number(s) : null);
  return {
    id: cells.event_id,
    title: cells.title,
    description: cells.description,
    date: cells.date,
    start_time: cells.start_time || null,
    end_time: cells.end_time || null,
    location: cells.location,
    category: cells.category,
    image_url: cells.image_url,
    image_alt: cells.image_alt,
    registration_url: cells.registration_url,
    status: cells.status.toLowerCase(),
    published: cells.published === "TRUE",
    difficulty: cells.difficulty,
    luma_event_id: cells.luma_event_id,
    links: parseLinks(cells.links).links,
    image_width: px(cells.image_width),
    image_height: px(cells.image_height),
  };
}
