import assert from "node:assert/strict";
import test from "node:test";
import { cleanText, isSiteImagePath, parsePublished, parseSheet, parseSheetDate, parseSheetTime, parseStatus, SHEET_LIMITS, SheetStructureError } from "./sheet";

const NY = "America/New_York";
const HEADER = ["event_id", "title", "description", "date", "start_time", "end_time", "location", "category", "image_url", "image_alt", "registration_url", "status", "published"] as const;

type Row = Partial<Record<(typeof HEADER)[number], unknown>>;
const row = (r: Row) => HEADER.map((h) => r[h] ?? "");
const sheet = (...rows: Row[]) => [[...HEADER], ...rows.map(row)];
const base: Row = { event_id: "gbm-1", title: "General Body Meeting", date: "2026-09-02", published: true };

test("a complete row becomes an event with instants in New York time", () => {
  const { events, problems } = parseSheet(
    sheet({
      ...base,
      description: "Bring a laptop.",
      start_time: "15:00",
      end_time: "16:00",
      location: "CMII 211",
      category: "Meeting",
      image_url: "https://example.com/a.webp",
      image_alt: "Flyer",
      registration_url: "https://pin.gsu.edu/event/1",
      status: "Upcoming",
    }),
    { timeZone: NY },
  );
  assert.deepEqual(problems, []);
  assert.equal(events.length, 1);
  const e = events[0];
  assert.equal(e.id, "gbm-1");
  assert.equal(e.title, "General Body Meeting");
  assert.equal(e.description, "Bring a laptop.");
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

test("a missing required column or header row is a structural failure, never an empty calendar", () => {
  assert.throws(() => parseSheet([["event_id", "title", "date"], ["a", "b", "2026-01-01"]], { timeZone: NY }), (e: unknown) => e instanceof SheetStructureError && /published/.test((e as Error).message));
  assert.throws(() => parseSheet([], { timeZone: NY }), SheetStructureError);
  assert.throws(() => parseSheet([["Notes"], ["x"]], { timeZone: NY }), SheetStructureError);
  // A header row with no data rows is a real, empty calendar.
  assert.deepEqual(parseSheet([[...HEADER]], { timeZone: NY }), { events: [], problems: [] });
});

test("serial date and time cells give the calendar day and wall clock", () => {
  // 46267 is 2026-09-02 in Sheets serial days (day 0 is 1899-12-30); 0.625 is 15:00.
  assert.equal(parseSheetDate(46267), "2026-09-02");
  assert.equal(parseSheetDate(46267.75), "2026-09-02");
  assert.equal(parseSheetTime(0.625), "15:00");
  assert.equal(parseSheetTime(46267.4375), "10:30");
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
  assert.deepEqual(
    problems.map((p) => [p.row, p.field]),
    [
      [2, "event_id"],
      [3, "event_id"],
      [4, "title"],
      [5, "date"],
    ],
  );
});

test("a duplicate event_id keeps the first row", () => {
  const { events, problems } = parseSheet(sheet({ ...base, title: "First" }, { ...base, title: "Second" }), { timeZone: NY });
  assert.equal(events.length, 1);
  assert.equal(events[0].title, "First");
  assert.equal(problems[0].row, 3);
});

test("blank and unpublished rows are skipped silently", () => {
  const { events, problems } = parseSheet([[...HEADER], ["", "", ""], row({ ...base, published: false }), row(base)], { timeZone: NY });
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
  assert.deepEqual(
    problems.map((p) => p.field),
    ["title", "description"],
  );
});

test("unsafe links are dropped, event kept", () => {
  for (const bad of ["javascript:alert(1)", "http://example.com/x", "data:text/html,hi", "https://user:pw@example.com/", "ftp://example.com", "example.com/x"]) {
    const { events, problems } = parseSheet(sheet({ ...base, registration_url: bad, image_url: bad }), { timeZone: NY });
    assert.equal(events.length, 1, bad);
    assert.equal(events[0].registrationUrl, null, bad);
    assert.equal(events[0].imageUrl, null, bad);
    assert.deepEqual(
      problems.map((p) => p.field),
      ["image_url", "registration_url"],
      bad,
    );
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

test("includeUnpublished keeps hidden rows and marks each event with published", () => {
  const values = sheet({ ...base, published: "FALSE" }, { ...base, event_id: "b" });
  const { events } = parseSheet(values, { timeZone: NY, includeUnpublished: true });
  assert.deepEqual(
    events.map((e) => [e.id, e.published]),
    [
      ["gbm-1", false],
      ["b", true],
    ],
  );
  const onlyPublished = parseSheet(values, { timeZone: NY });
  assert.deepEqual(
    onlyPublished.events.map((e) => [e.id, e.published]),
    [["b", true]],
  );
});
