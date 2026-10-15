import assert from "node:assert/strict";
import test from "node:test";
import type { ClubEvent } from "./event";
import { cellsFor, eventIdFor, formValuesFrom, readForm, validateEvent, type EventFormValues } from "./form";

const NY = "America/New_York";
const values = (over: Partial<EventFormValues> = {}): EventFormValues => ({
  title: "Resume Workshop",
  description: "Bring a draft.\n\nLeave with a stronger one.",
  date: "2026-09-22",
  start_time: "17:30",
  end_time: "19:30",
  location: "CLSO 150",
  category: "Workshop",
  registration_url: "https://pin.gsu.edu/organization/cysecclub/events",
  status: "upcoming",
  published: "on",
  image_alt: "",
  ...over,
});
const extra = { eventId: "resume-workshop-2026-09-22", imageUrl: null };

test("readForm trims, keeps description line breaks and fills missing fields with empty strings", () => {
  const form = new FormData();
  form.set("title", "  Resume Workshop ");
  form.set("description", "a\r\n\r\n\r\n\r\nb");
  form.set("published", "on");
  const v = readForm(form);
  assert.equal(v.title, "Resume Workshop");
  assert.equal(v.description, "a\n\nb");
  assert.equal(v.published, "on");
  assert.equal(v.date, "");
  assert.equal(v.registration_url, "");
});

test("cellsFor produces the 13 known cells with TRUE/FALSE and a capitalised status", () => {
  const cells = cellsFor(values(), { eventId: "x", imageUrl: "https://example.com/a.webp" });
  assert.deepEqual(cells, {
    event_id: "x",
    title: "Resume Workshop",
    description: "Bring a draft.\n\nLeave with a stronger one.",
    date: "2026-09-22",
    start_time: "17:30",
    end_time: "19:30",
    location: "CLSO 150",
    category: "Workshop",
    image_url: "https://example.com/a.webp",
    image_alt: "",
    registration_url: "https://pin.gsu.edu/organization/cysecclub/events",
    status: "Upcoming",
    published: "TRUE",
  });
  assert.equal(cellsFor(values({ published: "", status: "cancelled" }), extra).published, "FALSE");
  assert.equal(cellsFor(values({ status: "cancelled" }), extra).status, "Cancelled");
});

test("a valid form becomes an event with instants in New York time", () => {
  const result = validateEvent(values(), extra, NY);
  assert.ok(result.ok, JSON.stringify(result));
  assert.equal(result.event.id, "resume-workshop-2026-09-22");
  assert.equal(result.event.startsAt, "2026-09-22T21:30:00.000Z");
  assert.equal(result.event.endsAt, "2026-09-22T23:30:00.000Z");
  assert.equal(result.event.published, true);
  assert.equal(result.event.imageUrl, null);
  assert.equal(result.cells.published, "TRUE");
});

test("the form rejects what the sheet parser would skip or drop, with the error on the field", () => {
  const errorsFor = (over: Partial<EventFormValues>) => {
    const r = validateEvent(values(over), extra, NY);
    return r.ok ? {} : r.errors;
  };
  assert.equal(errorsFor({ title: "" }).title, "Required");
  assert.ok(errorsFor({ date: "soon" }).date);
  assert.ok(errorsFor({ start_time: "noon" }).start_time);
  assert.ok(errorsFor({ start_time: "19:30", end_time: "17:30" }).end_time);
  assert.ok(errorsFor({ registration_url: "http://example.com/x" }).registration_url);
  assert.ok(errorsFor({ title: "x".repeat(121) }).title);
  assert.ok(errorsFor({ status: "postponed" }).status);
  assert.ok(errorsFor({ image_alt: "y".repeat(301) }).image_alt);
});

test("eventIdFor slugs the title and date and never repeats a taken id", () => {
  assert.equal(eventIdFor("Résumé Workshop!", "2026-09-22", []), "resume-workshop-2026-09-22");
  assert.equal(eventIdFor("Résumé Workshop!", "2026-09-22", ["resume-workshop-2026-09-22"]), "resume-workshop-2026-09-22-2");
  assert.equal(eventIdFor("Résumé Workshop!", "2026-09-22", ["resume-workshop-2026-09-22", "resume-workshop-2026-09-22-2"]), "resume-workshop-2026-09-22-3");
  const first = eventIdFor("w".repeat(100), "2026-09-22", []);
  assert.ok(first.length <= 64 - 3, first);
  const long = eventIdFor("w".repeat(100), "2026-09-22", [first]);
  assert.ok(long.length <= 64, long);
  assert.match(long, /-2026-09-22-2$/);
  assert.equal(eventIdFor("!!!", "2026-09-22", []), "event-2026-09-22");
});

test("formValuesFrom round-trips an event through the form", () => {
  const event: ClubEvent = {
    id: "gbm-1",
    title: "General Body Meeting",
    description: "Meet the board.",
    category: "Meeting",
    date: "2026-09-02",
    startTime: "15:00",
    endTime: "16:00",
    startsAt: "2026-09-02T19:00:00.000Z",
    endsAt: "2026-09-02T20:00:00.000Z",
    location: "CMII 211",
    imageUrl: "/assets/events/general-body.webp",
    imageAlt: "Flyer",
    registrationUrl: null,
    status: "completed",
    published: false,
    row: 4,
  };
  const v = formValuesFrom(event);
  assert.equal(v.status, "completed");
  assert.equal(v.published, "");
  assert.equal(v.image_alt, "Flyer");
  const r = validateEvent(v, { eventId: event.id, imageUrl: event.imageUrl }, NY);
  assert.ok(r.ok);
  assert.deepEqual({ ...r.event, row: 4 }, event);
});
