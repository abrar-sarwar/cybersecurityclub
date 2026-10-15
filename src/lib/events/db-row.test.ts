import assert from "node:assert/strict";
import test from "node:test";
import { EVENT_COLUMNS, eventFromRow, rowFromCells, type EventRow } from "./db-row";
import { cellsFor, validateEvent, type EventFormValues } from "./form";

const NY = "America/New_York";
const row: EventRow = {
  id: "resume-workshop-2026-09-22",
  title: "Resume Workshop",
  description: "Bring a draft.\n\nLeave with a stronger one.",
  date: "2026-09-22",
  start_time: "17:30",
  end_time: "19:30",
  location: "CLSO 150",
  category: "Workshop",
  image_url: "https://abc.supabase.co/storage/v1/object/public/flyers/flyers/x.webp",
  image_alt: "Flyer",
  registration_url: "https://pin.gsu.edu/organization/cysecclub/events",
  status: "upcoming",
  published: true,
};
const values: EventFormValues = {
  title: row.title,
  description: row.description,
  date: row.date,
  start_time: row.start_time!,
  end_time: row.end_time!,
  location: row.location,
  category: row.category,
  registration_url: row.registration_url,
  status: "upcoming",
  published: "on",
  image_alt: row.image_alt,
};

test("a table row becomes the same event the form would produce", () => {
  const fromRow = eventFromRow(row, NY);
  assert.ok(fromRow.ok, JSON.stringify(fromRow));
  const fromForm = validateEvent(values, { eventId: row.id, imageUrl: row.image_url }, NY);
  assert.ok(fromForm.ok);
  assert.deepEqual(fromRow.event, fromForm.event);
  assert.equal(fromRow.event.startsAt, "2026-09-22T21:30:00.000Z");
});

test("hidden rows keep published false; null times mean the whole day", () => {
  const r = eventFromRow({ ...row, published: false, start_time: null, end_time: null }, NY);
  assert.ok(r.ok);
  assert.equal(r.event.published, false);
  assert.equal(r.event.startTime, null);
  assert.equal(r.event.endsAt, "2026-09-23T03:59:00.000Z");
});

test("invalid rows are reported and skipped, never thrown", () => {
  for (const bad of [{ ...row, date: "soon" }, { ...row, title: "" }, { ...row, start_time: "25:99" }, { ...row, id: "has space" }, null, "nope", 42]) {
    const r = eventFromRow(bad, NY);
    assert.equal(r.ok, false, JSON.stringify(bad));
    if (!r.ok) assert.match(r.problem, /\w/);
  }
  const badTime = eventFromRow({ ...row, start_time: "25:99" }, NY);
  assert.ok(!badTime.ok && /start_time/.test(badTime.problem));
});

test("form cells become a row with real booleans, lower-case status and null empty times", () => {
  const cells = cellsFor({ ...values, start_time: "", end_time: "", status: "cancelled", published: "" }, { eventId: row.id, imageUrl: null });
  const out = rowFromCells(cells);
  assert.deepEqual(out, { ...row, start_time: null, end_time: null, image_url: "", status: "cancelled", published: false });
  assert.deepEqual(Object.keys(out).sort(), [...EVENT_COLUMNS].sort());
});
