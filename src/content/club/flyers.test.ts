import assert from "node:assert/strict";
import test from "node:test";
import { splitEvents, type ClubEvent } from "./flyers";

const event = (title: string, datetime: string): ClubEvent => ({ title, datetime, detail: "" });

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
