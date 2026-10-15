import assert from "node:assert/strict";
import test from "node:test";
import { arrangeEvents } from "./board";
import type { ClubEvent } from "./event";

const make = (id: string, startsAt: string, endsAt: string, status: ClubEvent["status"] = "upcoming"): ClubEvent => ({
  id,
  title: id,
  description: null,
  category: null,
  date: startsAt.slice(0, 10),
  startTime: null,
  endTime: null,
  startsAt,
  endsAt,
  location: null,
  imageUrl: null,
  imageAlt: null,
  registrationUrl: null,
  status,
  published: true,
});

test("upcoming soonest first, past most recent first", () => {
  const events = [
    make("b", "2026-10-14T20:00:00Z", "2026-10-14T21:00:00Z"),
    make("a", "2026-09-02T19:00:00Z", "2026-09-02T20:00:00Z"),
    make("d", "2026-11-03T20:00:00Z", "2026-11-03T21:00:00Z"),
    make("c", "2026-10-01T19:00:00Z", "2026-10-01T20:00:00Z"),
  ];
  const { upcoming, past } = arrangeEvents(events, new Date("2026-10-05T00:00:00Z"));
  assert.deepEqual(
    upcoming.map((e) => e.id),
    ["b", "d"],
  );
  assert.deepEqual(
    past.map((e) => e.id),
    ["c", "a"],
  );
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
  assert.deepEqual(
    arrangeEvents([e], new Date("2026-01-01T00:00:00Z")).past.map((x) => x.id),
    ["done"],
  );
});

test("cancelled stays in upcoming while ahead and is dropped once over", () => {
  const e = make("gone", "2026-09-02T19:00:00Z", "2026-09-02T20:00:00Z", "cancelled");
  assert.equal(arrangeEvents([e], new Date("2026-09-01T00:00:00Z")).upcoming.length, 1);
  const after = arrangeEvents([e], new Date("2026-09-03T00:00:00Z"));
  assert.equal(after.upcoming.length, 0);
  assert.equal(after.past.length, 0);
});
