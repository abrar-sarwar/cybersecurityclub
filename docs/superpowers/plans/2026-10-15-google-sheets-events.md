# Google Sheets Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The events page reads officer-maintained rows from a Google Sheet through a read-only service account, validates them, caches them for five minutes and renders them with the existing design.

**Architecture:** Pure parsing and phase logic live in `src/lib/events/` and are unit tested without I/O. Google access (signed JWT, token exchange, values fetch) lives in `src/server/events/` with `fetch` injected for tests. One cached loader returns a result object the page renders; it never throws.

**Tech Stack:** Next.js 16.3.5 App Router, React 19, TypeScript, `node:crypto`, `node:test` via `tsx`. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-15-google-sheets-events-design.md`

## Global Constraints

- No new npm dependencies. Google access uses `fetch` and `node:crypto`.
- No credential, token or spreadsheet ID may reach client code or logs (spreadsheet ID may be logged as its first six characters only).
- Timezone is `branding.timezone` (`America/New_York`). All wall-clock conversion goes through `zonedLocalToUtc` in `src/lib/events/time.ts`.
- Text from the sheet is rendered as text by React. Never `dangerouslySetInnerHTML`, never Markdown.
- Modules under `src/lib/` have no Next.js or `server-only` imports so `tsx --test` can load them. `src/server/events/load-events.ts` is the only module that imports `next/cache` and `server-only`.
- Commit messages carry no Claude attribution lines (standing user rule).
- `/events` stays `export const dynamic = "force-dynamic"`.

## Review Focus

1. A date cell typed as a real Sheets date arrives as a serial number, not text; the parser must give the calendar day, not the day before, regardless of the server's zone (Task 2 test "serial date").
2. A row whose `published` cell is the text `FALSE`, blank, `no` or a stray value must never appear (Task 2 test "published fails closed").
3. An event with no times must stay in Upcoming for the whole of its own day in New York, including when the server runs in UTC (Task 3 test "no times lasts all day").
4. When Google is unreachable after a successful load, visitors must still see the last good list, not an error (Task 6 reasoning; loader keeps `lastGood`).
5. A pasted `javascript:` or `http:` link must drop the button but keep the event (Task 2 test "unsafe links are dropped, event kept").

---

### Task 1: Model, env example and cleanup of the static list

**Files:**
- Create: `src/lib/events/event.ts`
- Modify: `src/content/club/flyers.ts` (remove `ClubEvent`, `CLUB_EVENTS`, `splitEvents`; keep `NCL`)
- Delete: `src/content/club/flyers.test.ts`
- Modify: `package.json` (`test:unit` script)
- Modify: `.env.example`

**Interfaces:**
- Produces: `ClubEvent`, `EventStatus` types used by every later task.

- [ ] **Step 1: Create the model**

```ts
// src/lib/events/event.ts
/**
 * One published club event as the public pages render it. Built from a sheet
 * row by `parseSheet`; nothing here is stored anywhere.
 */
export type EventStatus = "upcoming" | "completed" | "cancelled";

export type ClubEvent = {
  /** The sheet's `event_id`, unique across published rows. */
  id: string;
  title: string;
  /** Plain text with line breaks preserved, or null. */
  description: string | null;
  category: string | null;
  /** The day it happens, YYYY-MM-DD in the club's timezone. */
  date: string;
  /** Wall clock HH:mm in the club's timezone, or null when the sheet gives none. */
  startTime: string | null;
  endTime: string | null;
  /** ISO instants derived from date and times; the phase split uses these. */
  startsAt: string;
  endsAt: string;
  location: string | null;
  /** An https URL or a site path such as /assets/events/flyer.webp. */
  imageUrl: string | null;
  imageAlt: string | null;
  registrationUrl: string | null;
  status: EventStatus;
};
```

- [ ] **Step 2: Strip the static list**

Replace `src/content/club/flyers.ts` with only the `NCL` export and this header comment:

```ts
/**
 * National Cyber League recruitment. A team is being formed this semester and
 * the linked form collects interest: it does not confirm a place, a cost or a
 * competition date, so nothing here states one.
 *
 * Events no longer live in this file: officers manage them in the club's
 * Google Sheet (see docs/events-google-sheet.md).
 */
export const NCL = { ...unchanged... } as const;
```

Delete `src/content/club/flyers.test.ts`.

- [ ] **Step 3: Update the unit test script**

In `package.json` set:

```json
"test:unit": "tsx --test src/components/marketing/network-state.test.ts src/components/marketing/network-layout.test.ts src/lib/events/time.test.ts src/lib/events/public.test.ts src/lib/events/sheet.test.ts src/lib/events/board.test.ts src/lib/events/format.test.ts src/server/events/google-jwt.test.ts src/server/events/google-sheets.test.ts src/components/site/event-board.test.tsx"
```

- [ ] **Step 4: Env example**

Append to `.env.example`:

```
# ---------------------------------------------------------------------------
# Events come from a Google Sheet, read server-side with a read-only service
# account. See docs/events-google-sheet.md for setup. These are secrets:
# set them in the host's environment, never in the client bundle.
# ---------------------------------------------------------------------------
# The long ID in the sheet's URL: https://docs.google.com/spreadsheets/d/<ID>/edit
GOOGLE_SHEETS_SPREADSHEET_ID=""
# The tab name (default "Events").
GOOGLE_SHEETS_RANGE="Events"
# From the service account's JSON key: "client_email" and "private_key".
GOOGLE_SERVICE_ACCOUNT_EMAIL=""
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=""
# How long the site serves the same sheet data before re-reading it, in seconds (default 300, minimum 30).
EVENTS_CACHE_SECONDS="300"
```

Also change the comment "The site has no accounts and no database, so nothing here is secret." to "The site has no accounts and no database. The Google credentials below are secret."

- [ ] **Step 5: Typecheck is expected to fail** (the events page still imports the removed symbols). Run `npm run typecheck` and confirm the only errors are in `src/app/(public)/events/page.tsx` and `src/components/site/event-board.tsx`. Do not commit yet; Task 1 is committed together with Task 7.

### Task 2: Pure sheet parser

**Files:**
- Create: `src/lib/events/sheet.ts`
- Test: `src/lib/events/sheet.test.ts`

**Interfaces:**
- Consumes: `zonedLocalToUtc`, `parseLocal` from `./time`; `isSafeHttpsUrl` from `./urls`; `ClubEvent`, `EventStatus` from `./event`.
- Produces: `parseSheet(values: readonly (readonly unknown[])[], options: { timeZone: string }): ParsedSheet`, `cleanText`, `parseSheetDate`, `parseSheetTime`, `parsePublished`, `parseStatus`, `isSiteImagePath`, `SHEET_LIMITS`, `REQUIRED_HEADERS`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/events/sheet.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { cleanText, isSiteImagePath, parsePublished, parseSheet, parseSheetDate, parseSheetTime, parseStatus, SHEET_LIMITS } from "./sheet";

const NY = "America/New_York";
const HEADER = ["event_id", "title", "description", "date", "start_time", "end_time", "location", "category", "image_url", "image_alt", "registration_url", "status", "published"];

type Row = Partial<Record<(typeof HEADER)[number], unknown>>;
const row = (r: Row) => HEADER.map((h) => r[h] ?? "");
const sheet = (...rows: Row[]) => [HEADER, ...rows.map(row)];
const base: Row = { event_id: "gbm-1", title: "General Body Meeting", date: "2026-09-02", published: true };

test("a complete row becomes an event with instants in New York time", () => {
  const { events, problems } = parseSheet(
    sheet({ ...base, description: "Bring a laptop.", start_time: "15:00", end_time: "16:00", location: "CMII 211", category: "Meeting", image_url: "https://example.com/a.webp", image_alt: "Flyer", registration_url: "https://pin.gsu.edu/event/1", status: "Upcoming" }),
    { timeZone: NY },
  );
  assert.deepEqual(problems, []);
  assert.equal(events.length, 1);
  const e = events[0];
  assert.equal(e.id, "gbm-1");
  assert.equal(e.date, "2026-09-02");
  assert.equal(e.startTime, "15:00");
  assert.equal(e.endTime, "16:00");
  assert.equal(e.startsAt, "2026-09-02T19:00:00.000Z");
  assert.equal(e.endsAt, "2026-09-02T20:00:00.000Z");
  assert.equal(e.location, "CMII 211");
  assert.equal(e.category, "Meeting");
  assert.equal(e.imageUrl, "https://example.com/a.webp");
  assert.equal(e.imageAlt, "Flyer");
  assert.equal(e.registrationUrl, "https://pin.gsu.edu/event/1");
  assert.equal(e.status, "upcoming");
});

test("columns are matched by header name in any order and case; extra columns are ignored", () => {
  const values = [
    ["Published", "Notes", " Title ", "DATE", "event_id"],
    [true, "ignored", "Workshop", "2026-10-20", "w1"],
  ];
  const { events, problems } = parseSheet(values, { timeZone: NY });
  assert.deepEqual(problems, []);
  assert.equal(events[0].title, "Workshop");
  assert.equal(events[0].date, "2026-10-20");
});

test("a missing required column reports a problem and yields nothing", () => {
  const { events, problems } = parseSheet([["event_id", "title", "date"], ["a", "b", "2026-01-01"]], { timeZone: NY });
  assert.deepEqual(events, []);
  assert.match(problems[0].message, /published/);
});

test("serial date and time cells give the calendar day and wall clock", () => {
  // 46266 is 2026-09-02 in Sheets serial days; 0.625 is 15:00.
  assert.equal(parseSheetDate(46266), "2026-09-02");
  assert.equal(parseSheetDate(46266.75), "2026-09-02");
  assert.equal(parseSheetTime(0.625), "15:00");
  assert.equal(parseSheetTime(46266.4375), "10:30");
  assert.equal(parseSheetTime(0), "00:00");
});

test("text dates in ISO and US forms, and impossible dates", () => {
  assert.equal(parseSheetDate("2026-09-02"), "2026-09-02");
  assert.equal(parseSheetDate(" 9/2/2026 "), "2026-09-02");
  assert.equal(parseSheetDate("2026-9-2"), "2026-09-02");
  assert.equal(parseSheetDate("2026-02-30"), null);
  assert.equal(parseSheetDate("1999-01-01"), null);
  assert.equal(parseSheetDate("Sept 2"), null);
  assert.equal(parseSheetDate(""), null);
});

test("text times in 24h and 12h forms", () => {
  assert.equal(parseSheetTime("15:00"), "15:00");
  assert.equal(parseSheetTime("3:00 PM"), "15:00");
  assert.equal(parseSheetTime("3pm"), "15:00");
  assert.equal(parseSheetTime("12:30 am"), "00:30");
  assert.equal(parseSheetTime("12 PM"), "12:00");
  assert.equal(parseSheetTime("9:05:00"), "09:05");
  assert.equal(parseSheetTime("25:00"), null);
  assert.equal(parseSheetTime("13 pm"), null);
  assert.equal(parseSheetTime("noon"), null);
});

test("published fails closed", () => {
  assert.equal(parsePublished(true), true);
  assert.equal(parsePublished("TRUE"), true);
  assert.equal(parsePublished(" yes "), true);
  assert.equal(parsePublished(1), true);
  assert.equal(parsePublished(false), false);
  assert.equal(parsePublished("FALSE"), false);
  assert.equal(parsePublished(""), false);
  assert.equal(parsePublished("no"), false);
  assert.equal(parsePublished("truthy"), false);
  assert.equal(parsePublished(undefined), false);
  const { events } = parseSheet(sheet({ ...base, published: "FALSE" }, { ...base, event_id: "x", published: "" }), { timeZone: NY });
  assert.deepEqual(events, []);
});

test("status words normalise; unknown words default to upcoming with a problem", () => {
  assert.equal(parseStatus(""), "upcoming");
  assert.equal(parseStatus("Completed"), "completed");
  assert.equal(parseStatus("CANCELLED"), "cancelled");
  assert.equal(parseStatus("canceled"), "cancelled");
  assert.equal(parseStatus("postponed"), null);
  const { events, problems } = parseSheet(sheet({ ...base, status: "postponed" }), { timeZone: NY });
  assert.equal(events[0].status, "upcoming");
  assert.equal(problems[0].field, "status");
});

test("rows missing event_id, title or date are skipped and reported with their row number", () => {
  const { events, problems } = parseSheet(
    sheet({ ...base, event_id: "" }, { ...base, event_id: "has space" }, { ...base, event_id: "ok", title: "" }, { ...base, event_id: "ok2", date: "soon" }),
    { timeZone: NY },
  );
  assert.deepEqual(events, []);
  assert.deepEqual(problems.map((p) => [p.row, p.field]), [[2, "event_id"], [3, "event_id"], [4, "title"], [5, "date"]]);
});

test("a duplicate event_id keeps the first row", () => {
  const { events, problems } = parseSheet(sheet({ ...base, title: "First" }, { ...base, title: "Second" }), { timeZone: NY });
  assert.equal(events.length, 1);
  assert.equal(events[0].title, "First");
  assert.equal(problems[0].row, 3);
});

test("blank and unpublished rows are skipped silently", () => {
  const { events, problems } = parseSheet([HEADER, ["", "", ""], row({ ...base, published: false }), row(base)], { timeZone: NY });
  assert.equal(events.length, 1);
  assert.deepEqual(problems, []);
});

test("text is trimmed, control and bidi characters removed, and over-long text cut", () => {
  assert.equal(cleanText("  a \u0000b‮  c "), "a b c");
  assert.equal(cleanText("line one\r\n\r\n\r\n\r\nline two", true), "line one\n\nline two");
  assert.equal(cleanText(42), "42");
  const long = "x".repeat(SHEET_LIMITS.title + 5);
  const { events, problems } = parseSheet(sheet({ ...base, title: long, description: "y".repeat(SHEET_LIMITS.description + 1) }), { timeZone: NY });
  assert.equal(events[0].title.length, SHEET_LIMITS.title);
  assert.equal(events[0].description?.length, SHEET_LIMITS.description);
  assert.deepEqual(problems.map((p) => p.field), ["title", "description"]);
});

test("unsafe links are dropped, event kept", () => {
  for (const bad of ["javascript:alert(1)", "http://example.com/x", "data:text/html,hi", "https://user:pw@example.com/", "ftp://example.com", "example.com/x"]) {
    const { events, problems } = parseSheet(sheet({ ...base, registration_url: bad, image_url: bad }), { timeZone: NY });
    assert.equal(events.length, 1, bad);
    assert.equal(events[0].registrationUrl, null, bad);
    assert.equal(events[0].imageUrl, null, bad);
    assert.deepEqual(problems.map((p) => p.field), ["image_url", "registration_url"], bad);
  }
});

test("image_url may be a site path; traversal and protocol-relative paths are not", () => {
  assert.equal(isSiteImagePath("/assets/events/general-body.webp"), true);
  assert.equal(isSiteImagePath("//evil.example/x.png"), false);
  assert.equal(isSiteImagePath("/assets/../x"), false);
  assert.equal(isSiteImagePath("/assets/a b.png"), false);
  assert.equal(isSiteImagePath("assets/x.png"), false);
  const { events } = parseSheet(sheet({ ...base, image_url: "/assets/events/general-body.webp" }), { timeZone: NY });
  assert.equal(events[0].imageUrl, "/assets/events/general-body.webp");
  assert.equal(events[0].imageAlt, "General Body Meeting flyer");
});

test("an end before the start is ignored; no times means the whole day", () => {
  const { events, problems } = parseSheet(sheet({ ...base, start_time: "16:00", end_time: "15:00" }, { ...base, event_id: "allday" }), { timeZone: NY });
  assert.equal(events[0].endTime, null);
  assert.equal(events[0].endsAt, "2026-09-03T03:59:00.000Z");
  assert.equal(problems[0].field, "end_time");
  assert.equal(events[1].startsAt, "2026-09-02T04:00:00.000Z");
  assert.equal(events[1].endsAt, "2026-09-03T03:59:00.000Z");
});

test("an unreadable optional time is reported and treated as absent", () => {
  const { events, problems } = parseSheet(sheet({ ...base, start_time: "afternoon" }), { timeZone: NY });
  assert.equal(events[0].startTime, null);
  assert.equal(problems[0].field, "start_time");
});

test("at most SHEET_LIMITS.rows data rows are read", () => {
  const rows: Row[] = [];
  for (let i = 0; i < SHEET_LIMITS.rows + 10; i++) rows.push({ ...base, event_id: `e${i}` });
  const { events, problems } = parseSheet(sheet(...rows), { timeZone: NY });
  assert.equal(events.length, SHEET_LIMITS.rows);
  assert.match(problems[0].message, /rows/);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test src/lib/events/sheet.test.ts`
Expected: FAIL, cannot find module `./sheet`.

- [ ] **Step 3: Implement**

```ts
// src/lib/events/sheet.ts
/**
 * Turns the cells of the officers' Google Sheet into events the site can
 * render. Pure: cells in, events and a list of row problems out. Every value
 * is untrusted text until it has been through here.
 *
 * Cells arrive as the Sheets API's UNFORMATTED_VALUE with SERIAL_NUMBER dates:
 * real date and time cells are numbers, checkboxes are booleans, and typed
 * text is a string. Each parser accepts both forms.
 */
import type { ClubEvent, EventStatus } from "./event";
import { parseLocal, zonedLocalToUtc } from "./time";
import { isSafeHttpsUrl } from "./urls";

export const SHEET_LIMITS = {
  rows: 500,
  id: 64,
  title: 120,
  description: 2000,
  location: 200,
  category: 40,
  imageAlt: 300,
  year: { min: 2000, max: 2100 },
} as const;

export const REQUIRED_HEADERS = ["event_id", "title", "date", "published"] as const;
export const OPTIONAL_HEADERS = ["description", "start_time", "end_time", "location", "category", "image_url", "image_alt", "registration_url", "status"] as const;
type Header = (typeof REQUIRED_HEADERS)[number] | (typeof OPTIONAL_HEADERS)[number];
const KNOWN_HEADERS: readonly string[] = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];

export type SheetProblem = { row: number; field?: string; message: string };
export type ParsedSheet = { events: ClubEvent[]; problems: SheetProblem[] };

type Cell = unknown;

/** Serial day 0 in Google Sheets is 1899-12-30. */
const SERIAL_EPOCH_MS = Date.UTC(1899, 11, 30);
const DAY_MS = 86_400_000;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000b-\u001f\u007f]/g;
const INVISIBLE = /[​-‏‪-‮⁦-⁩﻿]/g;

/** Trims, strips control and invisible characters and collapses blanks. With `multiline`, line breaks survive (at most one blank line in a row). */
export function cleanText(value: Cell, multiline = false): string {
  if (value === null || value === undefined) return "";
  let s = String(value).replace(/\r\n?/g, "\n").replace(CONTROL, "").replace(INVISIBLE, "").replace(/\t/g, " ");
  if (multiline) {
    s = s
      .split("\n")
      .map((line) => line.replace(/ {2,}/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
  } else {
    s = s.replace(/\s+/g, " ");
  }
  return s.trim();
}

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

/** A path on this site: starts with one slash, plain characters only, no `..`. */
export function isSiteImagePath(value: string): boolean {
  return /^\/[A-Za-z0-9_\-./]+$/.test(value) && !value.startsWith("//") && !value.includes("..");
}

function headerIndex(headerRow: readonly Cell[]): Map<Header, number> {
  const columns = new Map<Header, number>();
  headerRow.forEach((cell, i) => {
    const name = cleanText(cell).toLowerCase().replace(/\s+/g, "_");
    if (KNOWN_HEADERS.includes(name) && !columns.has(name as Header)) columns.set(name as Header, i);
  });
  return columns;
}

export function parseSheet(values: readonly (readonly Cell[])[], options: { timeZone: string }): ParsedSheet {
  const problems: SheetProblem[] = [];
  const [headerRow, ...rows] = values;
  if (!headerRow) return { events: [], problems: [{ row: 1, message: "The sheet has no header row" }] };
  const columns = headerIndex(headerRow);
  const missing = REQUIRED_HEADERS.filter((h) => !columns.has(h));
  if (missing.length) return { events: [], problems: [{ row: 1, message: `Missing required columns: ${missing.join(", ")}` }] };
  if (rows.length > SHEET_LIMITS.rows) problems.push({ row: SHEET_LIMITS.rows + 2, message: `Only the first ${SHEET_LIMITS.rows} rows are read; ${rows.length - SHEET_LIMITS.rows} more were ignored` });

  const events: ClubEvent[] = [];
  const seen = new Set<string>();

  rows.slice(0, SHEET_LIMITS.rows).forEach((cells, i) => {
    const row = i + 2;
    const cell = (h: Header): Cell => {
      const idx = columns.get(h);
      return idx === undefined ? undefined : cells[idx];
    };
    if (cells.every((c) => cleanText(c) === "")) return;
    if (!parsePublished(cell("published"))) return;

    const report = (field: string, message: string) => problems.push({ row, field, message });
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
    const startsAt = zonedLocalToUtc(`${date}T${startTime ?? "00:00"}`, options.timeZone);
    let endsAt = zonedLocalToUtc(`${date}T${endTime ?? "23:59"}`, options.timeZone);
    if (endsAt.getTime() <= startsAt.getTime()) endsAt = new Date(startsAt.getTime() + 60_000);

    seen.add(id);
    events.push({
      id,
      title,
      description: text("description", SHEET_LIMITS.description, true),
      category: text("category", SHEET_LIMITS.category),
      date,
      startTime,
      endTime,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      location: text("location", SHEET_LIMITS.location),
      imageUrl,
      imageAlt: imageUrl ? (text("image_alt", SHEET_LIMITS.imageAlt) ?? `${title} flyer`) : null,
      registrationUrl,
      status: status ?? "upcoming",
    });
  });

  return { events, problems };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test src/lib/events/sheet.test.ts`
Expected: all pass. If the serial-date test fails by one day, the epoch is wrong: 1899-12-30 is correct for Google Sheets.

- [ ] **Step 5: Commit**

```bash
git add src/lib/events/event.ts src/lib/events/sheet.ts src/lib/events/sheet.test.ts
git commit -m "Parse event rows from the officers' Google Sheet"
```

### Task 3: Board split and time formatting

**Files:**
- Create: `src/lib/events/board.ts`, `src/lib/events/format.ts`
- Test: `src/lib/events/board.test.ts`, `src/lib/events/format.test.ts`

**Interfaces:**
- Consumes: `classifyEvent` from `./public`; `ClubEvent` from `./event`.
- Produces: `arrangeEvents(events: readonly ClubEvent[], now: Date): { upcoming: ClubEvent[]; past: ClubEvent[] }`; `formatClockTime(hhmm: string): string`; `formatTimeRange(start: string | null, end: string | null): string | null`; `eventDetail(event: Pick<ClubEvent, "category" | "location" | "startTime" | "endTime">): string`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/events/board.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { arrangeEvents } from "./board";
import type { ClubEvent } from "./event";

const make = (id: string, startsAt: string, endsAt: string, status: ClubEvent["status"] = "upcoming"): ClubEvent => ({
  id, title: id, description: null, category: null, date: startsAt.slice(0, 10), startTime: null, endTime: null,
  startsAt, endsAt, location: null, imageUrl: null, imageAlt: null, registrationUrl: null, status,
});

test("upcoming soonest first, past most recent first", () => {
  const events = [
    make("b", "2026-10-14T20:00:00Z", "2026-10-14T21:00:00Z"),
    make("a", "2026-09-02T19:00:00Z", "2026-09-02T20:00:00Z"),
    make("d", "2026-11-03T20:00:00Z", "2026-11-03T21:00:00Z"),
    make("c", "2026-10-01T19:00:00Z", "2026-10-01T20:00:00Z"),
  ];
  const { upcoming, past } = arrangeEvents(events, new Date("2026-10-05T00:00:00Z"));
  assert.deepEqual(upcoming.map((e) => e.id), ["b", "d"]);
  assert.deepEqual(past.map((e) => e.id), ["c", "a"]);
});

test("no times lasts all day: still upcoming at 23:58 New York, past at 00:00 the next day", () => {
  // 2026-09-02 all day in New York is 04:00Z to 03:59Z next day.
  const e = make("all", "2026-09-02T04:00:00.000Z", "2026-09-03T03:59:00.000Z");
  assert.equal(arrangeEvents([e], new Date("2026-09-03T03:58:00Z")).upcoming.length, 1);
  assert.equal(arrangeEvents([e], new Date("2026-09-03T04:00:00Z")).past.length, 1);
});

test("an event that has started but not ended is still upcoming", () => {
  const e = make("now", "2026-09-02T19:00:00Z", "2026-09-02T20:00:00Z");
  assert.equal(arrangeEvents([e], new Date("2026-09-02T19:30:00Z")).upcoming.length, 1);
});

test("completed forces past even with a future date", () => {
  const e = make("done", "2099-01-01T00:00:00Z", "2099-01-01T01:00:00Z", "completed");
  assert.deepEqual(arrangeEvents([e], new Date("2026-01-01T00:00:00Z")).past.map((x) => x.id), ["done"]);
});

test("cancelled stays in upcoming while ahead and is dropped once over", () => {
  const e = make("gone", "2026-09-02T19:00:00Z", "2026-09-02T20:00:00Z", "cancelled");
  assert.equal(arrangeEvents([e], new Date("2026-09-01T00:00:00Z")).upcoming.length, 1);
  const after = arrangeEvents([e], new Date("2026-09-03T00:00:00Z"));
  assert.equal(after.upcoming.length, 0);
  assert.equal(after.past.length, 0);
});
```

```ts
// src/lib/events/format.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { eventDetail, formatClockTime, formatTimeRange } from "./format";

test("clock times read like a flyer", () => {
  assert.equal(formatClockTime("15:00"), "3:00 PM");
  assert.equal(formatClockTime("00:30"), "12:30 AM");
  assert.equal(formatClockTime("12:00"), "12:00 PM");
  assert.equal(formatClockTime("09:05"), "9:05 AM");
});

test("ranges share the period when they can", () => {
  assert.equal(formatTimeRange("15:00", "16:00"), "3:00 to 4:00 PM");
  assert.equal(formatTimeRange("11:30", "13:00"), "11:30 AM to 1:00 PM");
  assert.equal(formatTimeRange("15:00", null), "3:00 PM");
  assert.equal(formatTimeRange(null, "16:00"), "Until 4:00 PM");
  assert.equal(formatTimeRange(null, null), null);
});

test("the detail line joins what exists", () => {
  assert.equal(eventDetail({ category: "Workshop", location: "CMII 211", startTime: "15:00", endTime: "16:00" }), "Workshop · CMII 211 · 3:00 to 4:00 PM");
  assert.equal(eventDetail({ category: null, location: "CMII 211", startTime: null, endTime: null }), "CMII 211");
  assert.equal(eventDetail({ category: null, location: null, startTime: null, endTime: null }), "");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test src/lib/events/board.test.ts src/lib/events/format.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

```ts
// src/lib/events/board.ts
import type { ClubEvent } from "./event";
import { classifyEvent } from "./public";

export type EventBoard = { upcoming: ClubEvent[]; past: ClubEvent[] };

/**
 * Splits events for one instant. Upcoming (including anything happening
 * right now) runs soonest first; past runs most recent first. `Completed`
 * forces past. `Cancelled` stays visible in upcoming until its day is over,
 * then disappears: nothing happened, so it has no place in the archive.
 */
export function arrangeEvents(events: readonly ClubEvent[], now: Date): EventBoard {
  const byStart = [...events].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt) || a.title.localeCompare(b.title));
  const upcoming: ClubEvent[] = [];
  const past: ClubEvent[] = [];
  for (const event of byStart) {
    const over = event.status === "completed" || classifyEvent(event, now) === "past";
    if (!over) upcoming.push(event);
    else if (event.status !== "cancelled") past.push(event);
  }
  return { upcoming, past: past.reverse() };
}
```

```ts
// src/lib/events/format.ts
import type { ClubEvent } from "./event";

/** "15:00" as "3:00 PM". */
export function formatClockTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** "3:00 to 4:00 PM", "11:30 AM to 1:00 PM", "3:00 PM", "Until 4:00 PM" or null. */
export function formatTimeRange(start: string | null, end: string | null): string | null {
  if (start && end) {
    const s = formatClockTime(start);
    const e = formatClockTime(end);
    const samePeriod = s.slice(-2) === e.slice(-2);
    return samePeriod ? `${s.slice(0, -3)} to ${e}` : `${s} to ${e}`;
  }
  if (start) return formatClockTime(start);
  if (end) return `Until ${formatClockTime(end)}`;
  return null;
}

/** The one-line "what, where, when" under a title. Empty when the sheet gave none of them. */
export function eventDetail(event: Pick<ClubEvent, "category" | "location" | "startTime" | "endTime">): string {
  return [event.category, event.location, formatTimeRange(event.startTime, event.endTime)].filter(Boolean).join(" · ");
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test src/lib/events/board.test.ts src/lib/events/format.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/events/board.ts src/lib/events/board.test.ts src/lib/events/format.ts src/lib/events/format.test.ts
git commit -m "Split sheet events into upcoming and past and format their times"
```

### Task 4: Service account JWT and token exchange

**Files:**
- Create: `src/server/events/google-jwt.ts`
- Test: `src/server/events/google-jwt.test.ts`

**Interfaces:**
- Produces: `normalisePrivateKey(raw: string): string`; `createAssertion(account: ServiceAccount, scope: string, nowMs: number): string`; `exchangeAssertion(assertion: string, deps: { fetch: Fetch; now?: () => number; signal?: AbortSignal }): Promise<AccessToken>`; `createTokenSource(account, scope, deps: { fetch: Fetch; now?: () => number }): (signal?: AbortSignal) => Promise<string>`; `GoogleAuthError`; `TOKEN_URL`; types `ServiceAccount`, `Fetch`, `AccessToken`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/server/events/google-jwt.test.ts
import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import test from "node:test";
import { createAssertion, createTokenSource, exchangeAssertion, GoogleAuthError, normalisePrivateKey, TOKEN_URL } from "./google-jwt";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;
const account = { clientEmail: "events@project.iam.gserviceaccount.com", privateKey: pem };
const SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

test("the assertion carries the right claims and a signature the public key verifies", () => {
  const now = Date.UTC(2026, 9, 15, 12, 0, 0);
  const jwt = createAssertion(account, SCOPE, now);
  const [header, claims, signature] = jwt.split(".");
  assert.deepEqual(decode(header), { alg: "RS256", typ: "JWT" });
  assert.deepEqual(decode(claims), { iss: account.clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now / 1000, exp: now / 1000 + 3600 });
  assert.equal(verify("sha256", Buffer.from(`${header}.${claims}`), publicKey, Buffer.from(signature, "base64url")), true);
});

test("a private key pasted as one line with \\n escapes and quotes is restored", () => {
  const oneLine = `"${pem.replace(/\n/g, "\\n")}"`;
  assert.equal(normalisePrivateKey(oneLine), pem.trim());
  assert.doesNotThrow(() => createAssertion({ ...account, privateKey: normalisePrivateKey(oneLine) }, SCOPE, Date.now()));
});

test("the token exchange posts the assertion as a JWT bearer grant", async () => {
  let seen: { url: string; init: RequestInit } | null = null;
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    seen = { url: String(url), init: init ?? {} };
    return new Response(JSON.stringify({ access_token: "tok", expires_in: 3599, token_type: "Bearer" }), { status: 200 });
  }) as typeof fetch;
  const token = await exchangeAssertion("a.b.c", { fetch: fetchImpl, now: () => 1_000_000 });
  assert.deepEqual(token, { token: "tok", expiresAt: 1_000_000 + 3599 * 1000 });
  assert.equal(seen!.url, TOKEN_URL);
  assert.equal(seen!.init.method, "POST");
  assert.equal(String(seen!.init.body), "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=a.b.c");
});

test("a non-200 answer or a strange body is a GoogleAuthError that does not echo the body", async () => {
  const bad = (async () => new Response("secret-looking body", { status: 401 })) as typeof fetch;
  await assert.rejects(exchangeAssertion("a.b.c", { fetch: bad }), (err: unknown) => err instanceof GoogleAuthError && !String(err).includes("secret"));
  const odd = (async () => new Response("not json", { status: 200 })) as typeof fetch;
  await assert.rejects(exchangeAssertion("a.b.c", { fetch: odd }), GoogleAuthError);
});

test("the token source reuses a token until a minute before expiry and shares one exchange", async () => {
  let calls = 0;
  let clock = 0;
  const fetchImpl = (async () => {
    calls++;
    return new Response(JSON.stringify({ access_token: `tok${calls}`, expires_in: 3600 }), { status: 200 });
  }) as typeof fetch;
  const getToken = createTokenSource(account, SCOPE, { fetch: fetchImpl, now: () => clock });
  const [a, b] = await Promise.all([getToken(), getToken()]);
  assert.equal(a, "tok1");
  assert.equal(b, "tok1");
  assert.equal(calls, 1);
  clock = 3600_000 - 61_000;
  assert.equal(await getToken(), "tok1");
  clock = 3600_000 - 59_000;
  assert.equal(await getToken(), "tok2");
  assert.equal(calls, 2);
});

test("a failed exchange leaves the source able to try again", async () => {
  let calls = 0;
  const fetchImpl = (async () => {
    calls++;
    return calls === 1 ? new Response("", { status: 500 }) : new Response(JSON.stringify({ access_token: "ok", expires_in: 3600 }), { status: 200 });
  }) as typeof fetch;
  const getToken = createTokenSource(account, SCOPE, { fetch: fetchImpl });
  await assert.rejects(getToken(), GoogleAuthError);
  assert.equal(await getToken(), "ok");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test src/server/events/google-jwt.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// src/server/events/google-jwt.ts
/**
 * Google service-account sign-in without the Google SDK: an RS256 JWT signed
 * with node:crypto, exchanged for a short-lived access token. The private key
 * never leaves this process and is never logged.
 */
import { createPrivateKey, sign } from "node:crypto";

export const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TOKEN_LIFETIME_SECONDS = 3600;
const REFRESH_MARGIN_MS = 60_000;

export type Fetch = typeof fetch;
export type ServiceAccount = { clientEmail: string; privateKey: string };
export type AccessToken = { token: string; expiresAt: number };

export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

/** Restores a PEM key pasted into a single-line env var: surrounding quotes off, `\n` escapes back to line breaks. */
export function normalisePrivateKey(raw: string): string {
  return raw.trim().replace(/^"|"$/g, "").replace(/\\n/g, "\n").trim();
}

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

/** The signed assertion Google exchanges for an access token. Valid for one hour from `nowMs`. */
export function createAssertion(account: ServiceAccount, scope: string, nowMs: number): string {
  const iat = Math.floor(nowMs / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(JSON.stringify({ iss: account.clientEmail, scope, aud: TOKEN_URL, iat, exp: iat + TOKEN_LIFETIME_SECONDS }));
  const input = `${header}.${claims}`;
  const signature = sign("sha256", Buffer.from(input), createPrivateKey(account.privateKey)).toString("base64url");
  return `${input}.${signature}`;
}

export async function exchangeAssertion(assertion: string, deps: { fetch: Fetch; now?: () => number; signal?: AbortSignal }): Promise<AccessToken> {
  const body = new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion });
  const response = await deps.fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    cache: "no-store",
    signal: deps.signal,
  });
  if (!response.ok) throw new GoogleAuthError(`Google's token endpoint answered ${response.status}`);
  const json = (await response.json().catch(() => null)) as { access_token?: unknown; expires_in?: unknown } | null;
  if (!json || typeof json.access_token !== "string" || typeof json.expires_in !== "number") {
    throw new GoogleAuthError("Google's token endpoint returned an unexpected body");
  }
  return { token: json.access_token, expiresAt: (deps.now ?? Date.now)() + json.expires_in * 1000 };
}

/**
 * A function that returns a valid access token, minting one only when the
 * cached token is missing or within a minute of expiry. Concurrent callers
 * share one exchange.
 */
export function createTokenSource(account: ServiceAccount, scope: string, deps: { fetch: Fetch; now?: () => number }) {
  const now = deps.now ?? Date.now;
  let cached: AccessToken | null = null;
  let inflight: Promise<AccessToken> | null = null;
  return async function getToken(signal?: AbortSignal): Promise<string> {
    if (cached && cached.expiresAt - REFRESH_MARGIN_MS > now()) return cached.token;
    if (!inflight) {
      inflight = exchangeAssertion(createAssertion(account, scope, now()), { fetch: deps.fetch, now, signal }).finally(() => {
        inflight = null;
      });
    }
    cached = await inflight;
    return cached.token;
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test src/server/events/google-jwt.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/server/events/google-jwt.ts src/server/events/google-jwt.test.ts
git commit -m "Sign in to Google as the events service account with node:crypto"
```

### Task 5: Sheets client and env config

**Files:**
- Create: `src/server/events/google-sheets.ts`
- Test: `src/server/events/google-sheets.test.ts`

**Interfaces:**
- Consumes: `createTokenSource`, `normalisePrivateKey`, `Fetch` from `./google-jwt`.
- Produces: `readSheetsConfig(env?: NodeJS.ProcessEnv): { ok: true; config: SheetsConfig } | { ok: false; missing: string[] }`; `createSheetsClient(config: SheetsConfig, deps?: { fetch?: Fetch; now?: () => number; timeoutMs?: number }): { fetchValues(): Promise<unknown[][]> }`; `valuesRange(range: string): string`; `SheetsError`; `SHEETS_SCOPE`; type `SheetsConfig = { spreadsheetId; range; clientEmail; privateKey; cacheSeconds }`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/server/events/google-sheets.test.ts
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import test from "node:test";
import { createSheetsClient, readSheetsConfig, SheetsError, valuesRange } from "./google-sheets";
import { TOKEN_URL } from "./google-jwt";

const pem = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }) as string;
const env = {
  GOOGLE_SHEETS_SPREADSHEET_ID: "1abcDEF",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "svc@p.iam.gserviceaccount.com",
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: pem.replace(/\n/g, "\\n"),
};
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });

test("config reads the env, defaults the range and cache, and names what is missing", () => {
  const r = readSheetsConfig(env);
  assert.ok(r.ok);
  assert.equal(r.config.range, "Events");
  assert.equal(r.config.cacheSeconds, 300);
  assert.equal(r.config.privateKey, pem.trim());
  assert.deepEqual(readSheetsConfig({ ...env, EVENTS_CACHE_SECONDS: "45", GOOGLE_SHEETS_RANGE: "Fall 2026" }).ok && readSheetsConfig({ ...env, EVENTS_CACHE_SECONDS: "45", GOOGLE_SHEETS_RANGE: "Fall 2026" }), {
    ok: true,
    config: { spreadsheetId: "1abcDEF", range: "Fall 2026", clientEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL, privateKey: pem.trim(), cacheSeconds: 45 },
  });
  assert.equal((readSheetsConfig({ ...env, EVENTS_CACHE_SECONDS: "5" }) as { config: { cacheSeconds: number } }).config.cacheSeconds, 300);
  const missing = readSheetsConfig({ GOOGLE_SHEETS_SPREADSHEET_ID: " " });
  assert.deepEqual(missing, { ok: false, missing: ["GOOGLE_SHEETS_SPREADSHEET_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"] });
});

test("a tab name becomes a quoted, row-capped A1 range; an explicit A1 range is kept", () => {
  assert.equal(valuesRange("Events"), "'Events'!A1:Z501");
  assert.equal(valuesRange("Fall '26"), "'Fall ''26'!A1:Z501");
  assert.equal(valuesRange("Events!A1:M100"), "Events!A1:M100");
});

test("fetchValues asks for unformatted values with serial dates and sends the bearer token", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    if (String(url) === TOKEN_URL) return ok({ access_token: "tok", expires_in: 3600 });
    return ok({ range: "Events!A1:Z501", majorDimension: "ROWS", values: [["event_id"], ["a"]] });
  }) as typeof fetch;
  const config = (readSheetsConfig(env) as { config: Parameters<typeof createSheetsClient>[0] }).config;
  const values = await createSheetsClient(config, { fetch: fetchImpl }).fetchValues();
  assert.deepEqual(values, [["event_id"], ["a"]]);
  const sheets = new URL(calls[1].url);
  assert.equal(sheets.origin + sheets.pathname, "https://sheets.googleapis.com/v4/spreadsheets/1abcDEF/values/'Events'!A1%3AZ501");
  assert.equal(sheets.searchParams.get("valueRenderOption"), "UNFORMATTED_VALUE");
  assert.equal(sheets.searchParams.get("dateTimeRenderOption"), "SERIAL_NUMBER");
  assert.equal(sheets.searchParams.get("majorDimension"), "ROWS");
  assert.equal(new Headers(calls[1].init.headers).get("authorization"), "Bearer tok");
  assert.equal(calls[1].init.cache, "no-store");
});

test("an empty sheet is an empty list; errors and odd bodies are SheetsErrors", async () => {
  const config = (readSheetsConfig(env) as { config: Parameters<typeof createSheetsClient>[0] }).config;
  const withValues = (answer: () => Response) => createSheetsClient(config, { fetch: (async (url: string | URL | Request) => (String(url) === TOKEN_URL ? ok({ access_token: "t", expires_in: 3600 }) : answer())) as typeof fetch });
  assert.deepEqual(await withValues(() => ok({ range: "x" })).fetchValues(), []);
  await assert.rejects(withValues(() => new Response("denied", { status: 403 })).fetchValues(), (e: unknown) => e instanceof SheetsError && String(e).includes("403"));
  await assert.rejects(withValues(() => ok({ values: "nope" })).fetchValues(), SheetsError);
  await assert.rejects(withValues(() => new Response("<html>", { status: 200 })).fetchValues(), SheetsError);
});

test("a hung request is abandoned after the timeout", async () => {
  const config = (readSheetsConfig(env) as { config: Parameters<typeof createSheetsClient>[0] }).config;
  const hang = ((_url: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(init.signal?.reason)))) as typeof fetch;
  await assert.rejects(createSheetsClient(config, { fetch: hang, timeoutMs: 20 }).fetchValues(), (e: unknown) => (e as Error).name === "TimeoutError");
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test src/server/events/google-sheets.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// src/server/events/google-sheets.ts
/**
 * Reads the officers' sheet through the Sheets API v4 with a read-only
 * service account. Configuration comes from the environment; `fetch` can be
 * injected so tests never touch the network.
 */
import { createTokenSource, normalisePrivateKey, type Fetch } from "./google-jwt";
import { SHEET_LIMITS } from "@/lib/events/sheet";

export const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const DEFAULT_RANGE = "Events";
const DEFAULT_CACHE_SECONDS = 300;
const MIN_CACHE_SECONDS = 30;
const DEFAULT_TIMEOUT_MS = 8000;
const REQUIRED_ENV = ["GOOGLE_SHEETS_SPREADSHEET_ID", "GOOGLE_SERVICE_ACCOUNT_EMAIL", "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"] as const;

export type SheetsConfig = {
  spreadsheetId: string;
  /** A tab name, or a full A1 range when it contains `!`. */
  range: string;
  clientEmail: string;
  privateKey: string;
  cacheSeconds: number;
};

export class SheetsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SheetsError";
  }
}

export function readSheetsConfig(env: NodeJS.ProcessEnv = process.env): { ok: true; config: SheetsConfig } | { ok: false; missing: string[] } {
  const missing = REQUIRED_ENV.filter((key) => !env[key]?.trim());
  if (missing.length) return { ok: false, missing };
  const seconds = Number(env.EVENTS_CACHE_SECONDS ?? DEFAULT_CACHE_SECONDS);
  return {
    ok: true,
    config: {
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID!.trim(),
      range: env.GOOGLE_SHEETS_RANGE?.trim() || DEFAULT_RANGE,
      clientEmail: env.GOOGLE_SERVICE_ACCOUNT_EMAIL!.trim(),
      privateKey: normalisePrivateKey(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!),
      cacheSeconds: Number.isFinite(seconds) && seconds >= MIN_CACHE_SECONDS ? Math.floor(seconds) : DEFAULT_CACHE_SECONDS,
    },
  };
}

/** A tab name becomes `'Name'!A1:Z<rows+1>`; a range that already has a `!` is used as given. */
export function valuesRange(range: string): string {
  if (range.includes("!")) return range;
  return `'${range.replace(/'/g, "''")}'!A1:Z${SHEET_LIMITS.rows + 1}`;
}

export function createSheetsClient(config: SheetsConfig, deps: { fetch?: Fetch; now?: () => number; timeoutMs?: number } = {}) {
  const fetchImpl = deps.fetch ?? fetch;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const getToken = createTokenSource({ clientEmail: config.clientEmail, privateKey: config.privateKey }, SHEETS_SCOPE, { fetch: fetchImpl, now: deps.now });
  const url = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(config.spreadsheetId)}/values/${encodeURIComponent(valuesRange(config.range))}`);
  url.searchParams.set("majorDimension", "ROWS");
  url.searchParams.set("valueRenderOption", "UNFORMATTED_VALUE");
  url.searchParams.set("dateTimeRenderOption", "SERIAL_NUMBER");

  return {
    /** The sheet's cells, header row first. Rows are ragged: trailing empty cells are omitted by Google. */
    async fetchValues(): Promise<unknown[][]> {
      const signal = AbortSignal.timeout(timeoutMs);
      const token = await getToken(signal);
      const response = await fetchImpl(url, { headers: { authorization: `Bearer ${token}` }, cache: "no-store", signal });
      if (!response.ok) throw new SheetsError(`Sheets API answered ${response.status}`);
      const json = (await response.json().catch(() => null)) as { values?: unknown } | null;
      if (!json || typeof json !== "object") throw new SheetsError("Sheets API returned an unexpected body");
      const values = json.values ?? [];
      if (!Array.isArray(values) || !values.every(Array.isArray)) throw new SheetsError("Sheets API returned an unexpected body");
      return values as unknown[][];
    },
  };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx tsx --test src/server/events/google-sheets.test.ts`
Expected: all pass. Note: `encodeURIComponent` leaves `'` and `!` alone, so the path assertion in the test uses `'Events'!A1%3AZ501`.

- [ ] **Step 5: Commit**

```bash
git add src/server/events/google-sheets.ts src/server/events/google-sheets.test.ts
git commit -m "Read the events sheet through the Sheets API"
```

### Task 6: Cached loader

**Files:**
- Create: `src/server/events/load-events.ts`

**Interfaces:**
- Consumes: `readSheetsConfig`, `createSheetsClient` from `./google-sheets`; `parseSheet` from `@/lib/events/sheet`; `branding.timezone`.
- Produces: `loadEvents(): Promise<EventsResult>` with `EventsResult = { ok: true; events: ClubEvent[] } | { ok: false; reason: "unconfigured" | "unavailable" }`.

No unit test: this module imports `next/cache`, which only loads inside Next. It is covered by `npm run build`, the dev server check in Task 7 and the Playwright smoke test.

- [ ] **Step 1: Implement**

```ts
// src/server/events/load-events.ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: only the two pre-existing errors from Task 1 (events page and event board) remain.

- [ ] **Step 3: Commit**

```bash
git add src/server/events/load-events.ts
git commit -m "Load events from the sheet through the data cache with a last-good fallback"
```

### Task 7: Page, components, CSS and CSP

**Files:**
- Modify: `src/app/(public)/events/page.tsx`
- Modify: `src/components/site/event-board.tsx`
- Modify: `src/app/signal.css` (`.ev-next-summary`, new rules after `.ev-row-detail`)
- Modify: `src/proxy.ts` (`img-src`)
- Test: `src/components/site/event-board.test.tsx`
- Plus the Task 1 changes, committed here.

**Interfaces:**
- Consumes: `loadEvents`, `arrangeEvents`, `eventDetail`, `ClubEvent`, `clubToday`.
- Produces: `UpcomingEvents`, `PastEvents`, `EventsUnavailable`, `EventsLoading`, `EventDescription` components.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/site/event-board.test.tsx
import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { ClubEvent } from "@/lib/events/event";
import { EventDescription, PastEvents } from "./event-board";

const event: ClubEvent = {
  id: "x", title: "<b>Bold</b> & co", description: "Line one\n<script>alert(1)</script>", category: "Workshop", date: "2026-09-02",
  startTime: "15:00", endTime: "16:00", startsAt: "2026-09-02T19:00:00.000Z", endsAt: "2026-09-02T20:00:00.000Z",
  location: "CMII 211", imageUrl: "https://example.com/x.webp", imageAlt: "Flyer \"quoted\"", registrationUrl: null, status: "upcoming",
};

test("sheet text is rendered as text, never as markup", () => {
  const html = renderToStaticMarkup(<EventDescription text={event.description!} />);
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(!html.includes("<script>"));
  const past = renderToStaticMarkup(<PastEvents events={[event]} />);
  assert.ok(past.includes("&lt;b&gt;Bold&lt;/b&gt; &amp; co"));
  assert.ok(past.includes('alt="Flyer &quot;quoted&quot;"'));
  assert.ok(past.includes("Workshop · CMII 211 · 3:00 to 4:00 PM"));
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx tsx --test src/components/site/event-board.test.tsx`
Expected: FAIL, `EventDescription` is not exported.

- [ ] **Step 3: Rewrite the event board**

```tsx
// src/components/site/event-board.tsx
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { branding } from "@config/branding";
import { DiscordMark } from "@/components/brand/discord-mark";
import { ButtonLink } from "@/components/ui/button";
import type { ClubEvent } from "@/lib/events/event";
import { eventDetail } from "@/lib/events/format";

/**
 * The events page's lists, fed from the officers' Google Sheet. Upcoming
 * events lead: the next one is a large card with everything needed to turn
 * up, and any after it are compact rows. Past events are a strip of flyers.
 *
 * Every string here came from a spreadsheet cell. React renders it as text;
 * nothing is ever interpreted as HTML.
 */

/** Dates are plain YYYY-MM-DD days, so they are formatted in UTC to stay on that day. */
function dayParts(date: string) {
  const day = new Date(`${date}T00:00:00Z`);
  const part = (options: Intl.DateTimeFormatOptions) => day.toLocaleDateString("en-US", { timeZone: "UTC", ...options });
  return {
    weekday: part({ weekday: "long" }),
    month: part({ month: "long" }),
    monthShort: part({ month: "short" }),
    day: part({ day: "numeric" }),
  };
}

const isPin = (url: string) => /^https:\/\/([a-z0-9-]+\.)*pin\.gsu\.edu\//i.test(url);

function Rsvp({ event, size }: { event: ClubEvent; size: "sm" | "lg" }) {
  if (event.status === "cancelled") return null;
  const url = event.registrationUrl ?? branding.links.pinEvents;
  const label = event.registrationUrl ? (isPin(url) ? "RSVP on PIN" : "Register") : "Find it on PIN";
  return (
    <ButtonLink href={url} size={size} external>
      {label}
      <ArrowUpRight className="size-4" aria-hidden />
      <span className="sr-only"> (opens in a new tab)</span>
    </ButtonLink>
  );
}

/** Plain text from the sheet with its line breaks kept (see .ev-next-summary). */
export function EventDescription({ text }: { text: string }) {
  return <p className="ev-next-summary">{text}</p>;
}

function Flyer({ event, eager }: { event: ClubEvent; eager?: boolean }) {
  if (!event.imageUrl) return null;
  // Remote images are plain <img>: officers paste URLs from any host, and the CSP allows https: images.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={event.imageUrl} alt={event.imageAlt ?? ""} loading={eager ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" />;
}

function NextEvent({ event, today }: { event: ClubEvent; today: string }) {
  const date = dayParts(event.date);
  const detail = eventDetail(event);
  const cancelled = event.status === "cancelled";
  return (
    <article className="ev-next" data-flyer={event.imageUrl ? "" : undefined}>
      {event.imageUrl ? (
        <div className="ev-next-flyer">
          <Flyer event={event} eager />
        </div>
      ) : null}
      <div className="ev-next-body">
        <p className="ev-flag" data-cancelled={cancelled ? "" : undefined}>
          <span className="ev-flag-pulse" aria-hidden="true" />
          {cancelled ? "Cancelled" : event.date === today ? "Happening today" : "Next up"}
        </p>
        <h2 className="ev-next-title">{event.title}</h2>
        <dl className="ev-next-facts">
          <div>
            <dt>
              <CalendarDays className="size-4" aria-hidden />
              <span className="sr-only">When</span>
            </dt>
            <dd>
              <time dateTime={event.date}>
                {date.weekday}, {date.month} {date.day}
              </time>
            </dd>
          </div>
          {detail ? (
            <div>
              <dt>
                <MapPin className="size-4" aria-hidden />
                <span className="sr-only">Where and what time</span>
              </dt>
              <dd>{detail}</dd>
            </div>
          ) : null}
        </dl>
        {event.description ? <EventDescription text={event.description} /> : null}
        {cancelled ? <p className="ev-cancelled-note">This event has been cancelled. Watch Discord for what replaces it.</p> : null}
        <div className="ev-actions">
          <Rsvp event={event} size="lg" />
        </div>
      </div>
    </article>
  );
}

/** `today` is resolved once on the server in the club's own timezone and passed in. */
export function UpcomingEvents({ events, today }: { events: readonly ClubEvent[]; today: string }) {
  if (!events.length) {
    return (
      <div className="signal-empty">
        <span className="signal-empty-icon" aria-hidden="true">
          <CalendarDays className="size-5" />
        </span>
        <div>
          <h2 className="ev-empty-title">Nothing on the calendar right now</h2>
          <p className="ev-empty-text">New events are announced on PIN and in Discord first, and show up here as soon as they are confirmed.</p>
          <div className="ev-actions">
            <ButtonLink href={branding.links.pinEvents} external>
              Events on PIN
            </ButtonLink>
            <ButtonLink href={branding.links.discordInvite} variant="discord" external>
              <DiscordMark />
              Join Discord
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const [next, ...later] = events;
  return (
    <>
      <NextEvent event={next} today={today} />
      {later.length ? (
        <>
          <h2 className="ev-heading">Also coming up</h2>
          <ol className="ev-list">
            {later.map((event) => {
              const date = dayParts(event.date);
              const detail = eventDetail(event);
              const cancelled = event.status === "cancelled";
              return (
                <li key={event.id} className="ev-row" data-cancelled={cancelled ? "" : undefined}>
                  <time className="ev-row-date" dateTime={event.date}>
                    <span>{date.monthShort}</span>
                    <b>{date.day}</b>
                  </time>
                  <div className="ev-row-body">
                    <h3 className="ev-row-title">{event.title}</h3>
                    <p className="ev-row-detail">
                      {cancelled ? "Cancelled · " : ""}
                      {date.weekday}
                      {detail ? ` · ${detail}` : ""}
                    </p>
                  </div>
                  <Rsvp event={event} size="sm" />
                </li>
              );
            })}
          </ol>
        </>
      ) : null}
      <p className="ev-note">All times are Eastern. RSVPs happen on PIN, the official GSU student organization portal.</p>
    </>
  );
}

export function PastEvents({ events }: { events: readonly ClubEvent[] }) {
  if (!events.length) return null;
  return (
    <>
      <h2 className="ev-heading">Past events</h2>
      <ol className="ev-past">
        {events.map((event) => {
          const date = dayParts(event.date);
          const detail = eventDetail(event);
          return (
            <li key={event.id} className="ev-past-item">
              {event.imageUrl ? (
                <div className="ev-past-thumb">
                  <Flyer event={event} />
                </div>
              ) : null}
              <div>
                <p className="ev-past-date">
                  <time dateTime={event.date}>
                    {date.month} {date.day}
                  </time>
                </p>
                <h3 className="ev-past-title">{event.title}</h3>
                {detail ? <p className="ev-past-detail">{detail}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** Shown when the sheet could not be read and nothing good is cached. Never pretends the calendar is empty. */
export function EventsUnavailable() {
  return (
    <div className="signal-empty" role="status">
      <span className="signal-empty-icon" aria-hidden="true">
        <CalendarDays className="size-5" />
      </span>
      <div>
        <h2 className="ev-empty-title">The events list is not available right now</h2>
        <p className="ev-empty-text">We could not load the calendar. Upcoming events are also listed on PIN and announced in Discord.</p>
        <div className="ev-actions">
          <ButtonLink href={branding.links.pinEvents} external>
            Events on PIN
          </ButtonLink>
          <ButtonLink href={branding.links.discordInvite} variant="discord" external>
            <DiscordMark />
            Join Discord
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

export function EventsLoading() {
  return (
    <p className="ev-loading" role="status" aria-live="polite">
      Loading events…
    </p>
  );
}
```

- [ ] **Step 4: Rewrite the page**

```tsx
// src/app/(public)/events/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { EventsLoading, EventsUnavailable, PastEvents, UpcomingEvents } from "@/components/site/event-board";
import { clubToday } from "@/lib/dates";
import { arrangeEvents } from "@/lib/events/board";
import { loadEvents } from "@/server/events/load-events";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming meetings, workshops and competitions, with where and when to turn up and RSVP links on PIN.",
  alternates: { canonical: "/events" },
};

// Rendered per request so an event moves to "past" on the right day without a rebuild.
// The sheet itself is read through the data cache (see src/server/events/load-events.ts).
export const dynamic = "force-dynamic";

async function Board() {
  const result = await loadEvents();
  if (!result.ok) return <EventsUnavailable />;
  const now = new Date();
  const { upcoming, past } = arrangeEvents(result.events, now);
  return (
    <>
      <UpcomingEvents events={upcoming} today={clubToday(now)} />
      {past.length ? (
        <section className="container-x ev-archive">
          <PastEvents events={past} />
        </section>
      ) : null}
    </>
  );
}

export default function EventsPage() {
  return (
    <section className="container-x ev-page" aria-labelledby="page-title">
      {/* No hero: the next event is the first thing on the page. */}
      <h1 id="page-title" className="sr-only">
        Upcoming events
      </h1>
      <Suspense fallback={<EventsLoading />}>
        <Board />
      </Suspense>
    </section>
  );
}
```

Note: the archive section now nests inside the page section rather than following it. Check `.ev-archive` in `signal.css` still reads right (it sets a top margin only). If the archive looked wrong, move it back out by returning a fragment from `EventsPage` with two Suspense boundaries sharing one `loadEvents()` call; `loadEvents` dedupes in-flight reads so that is safe.

- [ ] **Step 5: CSS**

In `src/app/signal.css` change `.ev-next-summary` to add `white-space: pre-line;` and add after `.ev-row-detail`:

```css
/* A cancelled event keeps its place so people who planned to come see the change. */
.ev-flag[data-cancelled] {
  color: var(--color-muted);
}

.ev-flag[data-cancelled] .ev-flag-pulse {
  display: none;
}

.ev-row[data-cancelled] .ev-row-title {
  color: var(--color-muted);
  text-decoration: line-through;
}

.ev-cancelled-note {
  margin-top: 1rem;
  color: var(--color-muted);
  font-size: 0.95rem;
}

.ev-loading {
  padding: 2rem 0;
  color: var(--color-muted);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

- [ ] **Step 6: CSP**

In `src/proxy.ts` change `"img-src 'self' data: blob:"` to `"img-src 'self' https: data: blob:"` with the comment `// Event flyers are URLs officers paste into the sheet, so images may come from any https host.`

- [ ] **Step 7: Verify**

Run: `npx tsx --test src/components/site/event-board.test.tsx` → PASS.
Run: `npm run verify` → typecheck, lint and all unit tests pass.
Run: `npm run build` → succeeds.
Run `npm run dev` and open `http://localhost:3000/events` without credentials: the "not available" state renders and the server log shows one `[events] Google Sheets is not configured` line. Stop the server.

- [ ] **Step 8: Commit (with Task 1)**

```bash
git add package.json .env.example src/content/club/flyers.ts src/content/club/flyers.test.ts "src/app/(public)/events/page.tsx" src/components/site/event-board.tsx src/components/site/event-board.test.tsx src/app/signal.css src/proxy.ts
git commit -m "Render the events page from the Google Sheet"
```

### Task 8: Template, officer guide, README

**Files:**
- Create: `docs/events-template.csv`, `docs/events-google-sheet.md`
- Modify: `README.md`

- [ ] **Step 1: Template CSV**

```csv
event_id,title,description,date,start_time,end_time,location,category,image_url,image_alt,registration_url,status,published
gbm-fall-2026,General Body Meeting,"First meeting of the Fall 2026 semester. Meet the board, hear the plan for the semester and find out how to get involved.",2026-09-02,15:00,16:00,CMII Building Room 211,Meeting,/assets/events/general-body.webp,"Flyer reading: Wednesday, first meeting of the Fall 2026 semester, CMII Building Room 211, September 2, 3:00 to 4:00 pm.",https://pin.gsu.edu/organization/cysecclub/events,Completed,TRUE
fundamentals-2026-09,Mastering Cybersecurity Fundamentals,"A hands-on introduction to the ideas every security role builds on. No experience needed; bring a laptop.",2026-09-11,,,,Workshop,/assets/events/fundamentals.webp,"Flyer reading: Join us for our Mastering Cybersecurity Fundamentals workshop, over a background of code.",,Completed,TRUE
resume-workshop-2026-09,Resume Workshop,"GSU tech clubs present a resume workshop. Bring a draft and leave with a stronger one.",2026-09-22,17:30,19:30,CLSO 150,Workshop,/assets/events/resume-workshop.webp,"Flyer reading: GSU tech clubs present resume workshop, September 22nd, CLSO 150, 5:30 to 7:30 pm.",,Completed,TRUE
example-upcoming,Example: Lockpicking Night,"Delete this row or edit it into a real event. Line breaks in this cell show on the site.

Second paragraph here.",2026-11-05,18:00,20:00,Student Center East 218,Workshop,,,https://pin.gsu.edu/organization/cysecclub/events,Upcoming,FALSE
```

- [ ] **Step 2: Officer guide** at `docs/events-google-sheet.md` with these sections, written in full: What this is; The sheet (columns table copied from the spec, the rules for each, that the sheet is the admin); How to add, edit, cancel and hide an event; Images (host elsewhere and paste a direct https link, or add a file under `public/assets/events/` and use its `/assets/events/...` path; Google Drive share links do not work as image URLs); One-time setup (create the sheet from the template, Google Cloud project, enable Google Sheets API, create a service account with no roles, create a JSON key, share the sheet with the service account as Viewer, keep officers as Editors, do not "publish to the web"); Environment variables (names, where to set them on Vercel, how to paste the private key); How the site reads it (cache window, what happens when Google is down, what gets logged); Security notes (read-only scope, no write path, validation rules, CSP image change); Alternative: published CSV (how it would work and why it is not used: anyone with the link can read every column including unpublished rows, no access control, no revocation).

- [ ] **Step 3: README**

Replace the sentence "There is no database: events, the board and page content are files in `src/content/` and `content/`." with "There is no database. Events come from a Google Sheet that officers edit (see `docs/events-google-sheet.md`); the board and page content are files in `src/content/` and `content/`." Add an "Events" subsection under Local development explaining the three env vars and that without them the page shows the unavailable state. Update the checks table row for `test:unit` to "Homepage network logic, sheet parsing, event dates and Google sign-in".

- [ ] **Step 4: Commit**

```bash
git add docs/events-template.csv docs/events-google-sheet.md README.md
git commit -m "Document the events sheet for officers and the setup for maintainers"
```

### Task 9: Verification sweep

- [ ] `npm run verify` and `npm run build` pass.
- [ ] `grep -rn "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY\|PRIVATE KEY" .next/static` returns nothing (no secret name in client bundles).
- [ ] `npm run build && npm run start -- -p 3001` then `npx playwright test e2e/site.spec.ts` passes (events page responds 200 without credentials).
- [ ] `git status` shows only the pre-existing uncommitted `package-lock.json`/`package.json` Supabase dependency diff and `prisma/`; report those in the final message.
