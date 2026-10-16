import assert from "node:assert/strict";
import test from "node:test";
import { CLUB_EVENTS, eventsInMonth, formatEventTime, monthWeeks, splitEvents, type ClubEvent } from "./events";

const event = (title: string, date: string, start?: string): ClubEvent => ({ id: `${date}-${title}`, title, date, start, category: "Workshop" });

const EVENTS = [event("b", "2026-10-14"), event("a", "2026-09-02"), event("d", "2026-11-03"), event("c", "2026-10-01")];

test("upcoming events run soonest first, past events most recent first", () => {
  const { upcoming, past } = splitEvents(EVENTS, "2026-10-05");
  assert.deepEqual(upcoming.map((e) => e.title), ["b", "d"]);
  assert.deepEqual(past.map((e) => e.title), ["c", "a"]);
});

test("an event stays upcoming for the whole of its own day", () => {
  const { upcoming, past } = splitEvents(EVENTS, "2026-10-01");
  assert.equal(upcoming[0].title, "c");
  assert.deepEqual(past.map((e) => e.title), ["a"]);
});

test("nothing scheduled leaves upcoming empty", () => {
  const { upcoming, past } = splitEvents(EVENTS, "2026-12-01");
  assert.deepEqual(upcoming, []);
  assert.equal(past.length, 4);
});

test("event ids are unique", () => {
  assert.equal(new Set(CLUB_EVENTS.map((e) => e.id)).size, CLUB_EVENTS.length);
});

test("event times read as a range, a single time, or nothing", () => {
  assert.equal(formatEventTime({ start: "18:30", end: "20:00" }), "6:30 PM to 8:00 PM");
  assert.equal(formatEventTime({ start: "09:05" }), "9:05 AM");
  assert.equal(formatEventTime({}), null);
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
  assert.deepEqual(eventsInMonth(list, "2026-10").map((e) => e.title), ["first", "early", "late"]);
});
