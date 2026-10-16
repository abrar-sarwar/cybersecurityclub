/**
 * Turns the cells of the officers' Google Sheet into events the site can
 * render. Pure: cells in, events and a list of row problems out. Every value
 * is untrusted text until it has been through here. A sheet whose header row
 * is missing or incomplete throws: that is an outage, not an empty calendar.
 *
 * Cells arrive as the Sheets API's UNFORMATTED_VALUE with SERIAL_NUMBER dates:
 * real date and time cells are numbers, checkboxes are booleans, and typed
 * text is a string. Each parser accepts both forms.
 */
import { EVENT_DIFFICULTIES, type ClubEvent, type EventDifficulty, type EventStatus } from "./event";
import { parseLinks } from "./links";
import { cleanText } from "./text";
import { parseLocal, zonedLocalToUtc } from "./time";
import { isSafeHttpsUrl } from "./urls";

export { cleanText } from "./text";

export const SHEET_LIMITS = {
  rows: 500,
  id: 64,
  title: 120,
  description: 2000,
  location: 200,
  category: 40,
  imageAlt: 300,
  imagePx: 10_000,
  lumaId: 64,
  year: { min: 2000, max: 2100 },
} as const;

export const REQUIRED_HEADERS = ["event_id", "title", "date", "published"] as const;
export const OPTIONAL_HEADERS = ["description", "start_time", "end_time", "location", "category", "image_url", "image_alt", "registration_url", "status", "difficulty", "luma_event_id", "links", "image_width", "image_height"] as const;
type Header = (typeof REQUIRED_HEADERS)[number] | (typeof OPTIONAL_HEADERS)[number];
const KNOWN_HEADERS: readonly string[] = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];

export type SheetProblem = { row: number; field?: string; message: string };
export type ParsedSheet = { events: ClubEvent[]; problems: SheetProblem[] };

/** The sheet as a whole cannot be read (no header row, or a required column is missing). Never an empty calendar. */
export class SheetStructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetStructureError";
  }
}

type Cell = unknown;

/** Serial day 0 in Google Sheets is 1899-12-30. */
const SERIAL_EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 86_400_000;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
const LUMA_ID = /^evt-[A-Za-z0-9]+$/;
const two = (n: number) => String(n).padStart(2, "0");

function dayKeyOf(year: number, month: number, day: number): string | null {
  const key = `${year}-${two(month)}-${two(day)}`;
  const parts = parseLocal(key);
  if (!parts || parts.year < SHEET_LIMITS.year.min || parts.year > SHEET_LIMITS.year.max) return null;
  return key;
}

/** A Sheets date (serial number or text as YYYY-MM-DD or M/D/YYYY) as YYYY-MM-DD, or null. */
export function parseSheetDate(value: Cell): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    const d = new Date(SERIAL_EPOCH_MS + Math.floor(value) * DAY_MS);
    return dayKeyOf(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }
  const s = cleanText(value);
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return dayKeyOf(Number(m[1]), Number(m[2]), Number(m[3]));
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (m) return dayKeyOf(Number(m[3]), Number(m[1]), Number(m[2]));
  return null;
}

/** A Sheets time (fraction of a day, or text in 24 hour or AM/PM form) as HH:mm, or null. */
export function parseSheetTime(value: Cell): string | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) return null;
    const minutes = Math.round((value - Math.floor(value)) * 1440) % 1440;
    return `${two(Math.floor(minutes / 60))}:${two(minutes % 60)}`;
  }
  const s = cleanText(value).toLowerCase().replace(/\./g, "");
  const m = /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)?$/.exec(s);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = m[2] ? Number(m[2]) : 0;
  const period = m[3];
  if (minute > 59) return null;
  if (period) {
    if (hour < 1 || hour > 12) return null;
    hour = (hour % 12) + (period === "pm" ? 12 : 0);
  } else if (hour > 23) {
    return null;
  }
  return `${two(hour)}:${two(minute)}`;
}

/** TRUE only for a checked box or the words TRUE, yes or 1. Anything else is unpublished. */
export function parsePublished(value: Cell): boolean {
  if (value === true) return true;
  if (typeof value === "number") return value === 1;
  const s = cleanText(value).toLowerCase();
  return s === "true" || s === "yes" || s === "1";
}

/** Empty means upcoming. Unknown words return null so the caller can report them. */
export function parseStatus(value: Cell): EventStatus | null {
  const s = cleanText(value).toLowerCase();
  if (s === "" || s === "upcoming") return "upcoming";
  if (s === "completed") return "completed";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  return null;
}

/** A level from the fixed list, matched without regard to case; anything else is null. */
export function parseDifficulty(value: Cell): EventDifficulty | null {
  const s = cleanText(value).toLowerCase();
  return EVENT_DIFFICULTIES.find((d) => d.toLowerCase() === s) ?? null;
}

/** A Luma event id, typed bare (`evt-…`) or pasted as the event's luma.com / lu.ma link. Null when it is neither. */
export function parseLumaEventId(value: Cell): string | null {
  const s = cleanText(value);
  if (!s || s.length > 200) return null;
  const id = /^https:\/\/(?:www\.)?(?:luma\.com|lu\.ma)\/(?:event\/)?([^/?#]+)/i.exec(s)?.[1] ?? s;
  return LUMA_ID.test(id) && id.length <= SHEET_LIMITS.lumaId ? id : null;
}

/** A whole number of pixels between 1 and the limit, from a number or digits; null otherwise. */
export function parsePixels(value: Cell): number | null {
  const n = typeof value === "number" ? value : /^\d{1,5}$/.test(cleanText(value)) ? Number(cleanText(value)) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= SHEET_LIMITS.imagePx ? n : null;
}

/** A path on this site: starts with one slash, plain characters only, no `..`. */
export function isSiteImagePath(value: string): boolean {
  return /^\/[A-Za-z0-9_\-./]+$/.test(value) && !value.startsWith("//") && !value.includes("..");
}

/** A header cell as the parser matches it: trimmed, lower case, blanks to underscores. */
export const normaliseHeader = (cell: Cell) => cleanText(cell).toLowerCase().replace(/\s+/g, "_");

function headerIndex(headerRow: readonly Cell[]): Map<Header, number> {
  const columns = new Map<Header, number>();
  headerRow.forEach((cell, i) => {
    const name = normaliseHeader(cell);
    if (KNOWN_HEADERS.includes(name) && !columns.has(name as Header)) columns.set(name as Header, i);
  });
  return columns;
}

export function parseSheet(values: readonly (readonly Cell[])[], options: { timeZone: string; includeUnpublished?: boolean }): ParsedSheet {
  const problems: SheetProblem[] = [];
  const [headerRow, ...rows] = values;
  if (!headerRow) throw new SheetStructureError("The sheet has no header row");
  const columns = headerIndex(headerRow);
  const missing = REQUIRED_HEADERS.filter((h) => !columns.has(h));
  if (missing.length) throw new SheetStructureError(`Missing required columns: ${missing.join(", ")}`);
  if (rows.length > SHEET_LIMITS.rows) {
    problems.push({ row: SHEET_LIMITS.rows + 2, message: `Only the first ${SHEET_LIMITS.rows} rows are read; ${rows.length - SHEET_LIMITS.rows} more were ignored` });
  }

  const events: ClubEvent[] = [];
  const seen = new Set<string>();

  rows.slice(0, SHEET_LIMITS.rows).forEach((cells, i) => {
    const row = i + 2;
    const cell = (h: Header): Cell => {
      const idx = columns.get(h);
      return idx === undefined ? undefined : cells[idx];
    };
    if (cells.every((c) => cleanText(c) === "")) return;
    const published = parsePublished(cell("published"));
    if (!published && !options.includeUnpublished) return;

    const report = (field: string, message: string) => {
      problems.push({ row, field, message });
    };
    const text = (h: Header, max: number, multiline = false): string | null => {
      const s = cleanText(cell(h), multiline);
      if (!s) return null;
      if (s.length > max) {
        report(h, `Longer than ${max} characters; cut to fit`);
        return s.slice(0, max).trim();
      }
      return s;
    };
    const link = (h: Header, allowSitePath: boolean): string | null => {
      const s = cleanText(cell(h));
      if (!s) return null;
      if (isSafeHttpsUrl(s) || (allowSitePath && isSiteImagePath(s))) return s;
      report(h, allowSitePath ? "Must be an https:// link or a /assets/... path; ignored" : "Must be an https:// link; ignored");
      return null;
    };
    const time = (h: Header): string | null => {
      const raw = cell(h);
      if (cleanText(raw) === "") return null;
      const parsed = parseSheetTime(raw);
      if (parsed === null) report(h, "Not a time such as 3:00 PM or 15:00; ignored");
      return parsed;
    };

    const id = cleanText(cell("event_id"));
    if (!ID_PATTERN.test(id)) return report("event_id", "Required: 1 to 64 letters, digits, - or _");
    if (seen.has(id)) return report("event_id", `Duplicate event_id "${id}"; the first row wins`);
    const title = text("title", SHEET_LIMITS.title);
    if (!title) return report("title", "Required");
    const date = parseSheetDate(cell("date"));
    if (!date) return report("date", "Required as YYYY-MM-DD, M/D/YYYY or a date cell");

    const startTime = time("start_time");
    let endTime = time("end_time");
    if (startTime && endTime && endTime <= startTime) {
      report("end_time", "Ends before it starts; ignored");
      endTime = null;
    }
    const status = parseStatus(cell("status"));
    if (status === null) report("status", "Use Upcoming, Completed or Cancelled; treated as Upcoming");

    const imageUrl = link("image_url", true);
    const registrationUrl = link("registration_url", false);
    const difficultyText = cleanText(cell("difficulty"));
    const difficulty = parseDifficulty(difficultyText);
    if (difficultyText && !difficulty) report("difficulty", `Use ${EVENT_DIFFICULTIES.join(", ")}; ignored`);
    const lumaText = cleanText(cell("luma_event_id"));
    const lumaEventId = parseLumaEventId(lumaText);
    if (lumaText && !lumaEventId) report("luma_event_id", "Use the Luma event id, which starts with evt-, or the event's luma.com link; ignored");
    const materials = parseLinks(cell("links"));
    for (const message of materials.problems) report("links", message);
    const pixels = (h: Header): number | null => {
      if (!imageUrl || cleanText(cell(h)) === "") return null;
      const parsed = parsePixels(cell(h));
      if (parsed === null) report(h, `Must be a whole number of pixels up to ${SHEET_LIMITS.imagePx}; ignored`);
      return parsed;
    };
    const imageWidth = pixels("image_width");
    const imageHeight = pixels("image_height");
    const sized = imageWidth !== null && imageHeight !== null;
    const startsAt = zonedLocalToUtc(`${date}T${startTime ?? "00:00"}`, options.timeZone);
    let endsAt = zonedLocalToUtc(`${date}T${endTime ?? "23:59"}`, options.timeZone);
    if (endsAt.getTime() <= startsAt.getTime()) endsAt = new Date(startsAt.getTime() + 60_000);

    seen.add(id);
    events.push({
      id,
      title,
      description: text("description", SHEET_LIMITS.description, true),
      category: text("category", SHEET_LIMITS.category),
      difficulty,
      date,
      startTime,
      endTime,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      location: text("location", SHEET_LIMITS.location),
      imageUrl,
      imageAlt: imageUrl ? (text("image_alt", SHEET_LIMITS.imageAlt) ?? `${title} flyer`) : null,
      imageWidth: sized ? imageWidth : null,
      imageHeight: sized ? imageHeight : null,
      registrationUrl,
      lumaEventId,
      links: materials.links,
      status: status ?? "upcoming",
      published,
    });
  });

  return { events, problems };
}
