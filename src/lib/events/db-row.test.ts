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
  image_url: "https://abc.supabase.co/storage/v1/object/public/flyers/x.webp",
  image_alt: "Flyer",
  registration_url: "https://pin.gsu.edu/organization/cysecclub/events",
  status: "upcoming",
  published: true,
  difficulty: "All Levels",
  luma_event_id: "evt-36OCwMiom4FIR00",
  links: [{ label: "Slides", href: "https://example.com/s" }],
  image_width: 1000,
  image_height: 1250,
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
  difficulty: "All Levels",
  luma_event_id: "evt-36OCwMiom4FIR00",
  links: "Slides | https://example.com/s",
};

test("a table row becomes the same event the form would produce", () => {
  const fromRow = eventFromRow(row, NY);
  assert.ok(fromRow.ok, JSON.stringify(fromRow));
  const fromForm = validateEvent(values, { eventId: row.id, imageUrl: row.image_url, imageWidth: 1000, imageHeight: 1250 }, NY);
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

test("rows the rules skip are reported and rejected, never thrown", () => {
  for (const bad of [{ ...row, date: "soon" }, { ...row, title: "" }, { ...row, id: "has space" }, null, "nope", 42]) {
    const r = eventFromRow(bad, NY);
    assert.equal(r.ok, false, JSON.stringify(bad));
    if (!r.ok) assert.match(r.problem, /\w/);
  }
  const badDate = eventFromRow({ ...row, date: "soon" }, NY);
  assert.ok(!badDate.ok && /resume-workshop-2026-09-22 date/.test(badDate.problem));
});

test("a row with a bad optional field keeps the event, drops the field and carries a warning", () => {
  const badTime = eventFromRow({ ...row, start_time: "25:99" }, NY);
  assert.ok(badTime.ok, JSON.stringify(badTime));
  assert.equal(badTime.event.startTime, null);
  assert.equal(badTime.warnings.length, 1);
  assert.match(badTime.warnings[0], /^resume-workshop-2026-09-22 start_time:/);
  const badLink = eventFromRow({ ...row, registration_url: "http://example.com/x" }, NY);
  assert.ok(badLink.ok);
  assert.equal(badLink.event.registrationUrl, null);
  assert.match(badLink.warnings[0], /registration_url/);
  const clean = eventFromRow(row, NY);
  assert.ok(clean.ok);
  assert.deepEqual(clean.warnings, []);
});

test("form cells become a row with real booleans, lower-case status and null empty times", () => {
  const cells = cellsFor({ ...values, start_time: "", end_time: "", status: "cancelled", published: "" }, { eventId: row.id, imageUrl: null, imageWidth: null, imageHeight: null });
  const out = rowFromCells(cells);
  assert.deepEqual(out, { ...row, start_time: null, end_time: null, image_url: "", status: "cancelled", published: false, image_width: null, image_height: null });
  assert.deepEqual(Object.keys(out).sort(), [...EVENT_COLUMNS].sort());
});

test("materials go into the row as an array and come back out as links", () => {
  const cells = cellsFor({ ...values, links: "Slides | https://example.com/s\nRepo | https://github.com/x/y" }, { eventId: row.id, imageUrl: null, imageWidth: null, imageHeight: null });
  const out = rowFromCells(cells);
  assert.deepEqual(out.links, [
    { label: "Slides", href: "https://example.com/s" },
    { label: "Repo", href: "https://github.com/x/y" },
  ]);
  const back = eventFromRow({ ...row, links: out.links }, NY);
  assert.ok(back.ok);
  assert.deepEqual(back.event.links, out.links);
});
