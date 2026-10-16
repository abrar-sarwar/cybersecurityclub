import assert from "node:assert/strict";
import test from "node:test";
import { eventsInMonth, eventsOn, monthWeeks } from "./calendar";
import type { ClubEvent } from "./event";

const event = (title: string, date: string, startTime: string | null = null): ClubEvent => ({
  id: `${date}-${title}`,
  title,
  description: null,
  category: null,
  difficulty: null,
  date,
  startTime,
  endTime: null,
  startsAt: `${date}T${startTime ?? "00:00"}:00.000Z`,
  endsAt: `${date}T23:59:00.000Z`,
  location: null,
  imageUrl: null,
  imageAlt: null,
  imageWidth: null,
  imageHeight: null,
  registrationUrl: null,
  lumaEventId: null,
  links: [],
  status: "upcoming",
  published: true,
});

test("a month is laid out in full Sunday-first weeks", () => {
  const weeks = monthWeeks(2026, 9); // October 2026 starts on a Thursday
  assert.ok(weeks.every((w) => w.length === 7));
  assert.deepEqual(weeks[0], [null, null, null, null, "2026-10-01", "2026-10-02", "2026-10-03"]);
  assert.equal(weeks.flat().filter(Boolean).length, 31);
  assert.equal(monthWeeks(2028, 1).flat().filter(Boolean).length, 29);
});

test("a month's events come back in date then time order", () => {
  const list = [event("late", "2026-10-14", "18:00"), event("other", "2026-11-01"), event("early", "2026-10-14", "09:00"), event("first", "2026-10-02")];
  assert.deepEqual(
    eventsInMonth(list, "2026-10").map((e) => e.title),
    ["first", "early", "late"],
  );
});

test("a day's events come back earliest first; untimed ones lead", () => {
  const list = [event("noon", "2026-10-14", "12:00"), event("allday", "2026-10-14"), event("other", "2026-10-15"), event("morning", "2026-10-14", "09:00")];
  assert.deepEqual(
    eventsOn(list, "2026-10-14").map((e) => e.title),
    ["allday", "morning", "noon"],
  );
  assert.deepEqual(eventsOn(list, "2026-10-16"), []);
});
