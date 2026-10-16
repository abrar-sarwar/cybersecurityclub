import assert from "node:assert/strict";
import test from "node:test";
import { classifyEvent, splitPublicEvents } from "./public";

const at = (iso: string) => new Date(iso);
const ev = (title: string, startsAt: string, endsAt: string) => ({ title, startsAt, endsAt });

test("an event is upcoming, then happening, then past once it ends", () => {
  const e = ev("GBM", "2026-09-02T19:00:00Z", "2026-09-02T20:00:00Z");
  assert.equal(classifyEvent(e, at("2026-09-02T18:59:59Z")), "upcoming");
  assert.equal(classifyEvent(e, at("2026-09-02T19:00:00Z")), "now");
  assert.equal(classifyEvent(e, at("2026-09-02T19:59:59Z")), "now");
  assert.equal(classifyEvent(e, at("2026-09-02T20:00:00Z")), "past");
  assert.equal(classifyEvent(e, at("2026-09-02T20:01:00Z")), "past");
});

test("upcoming soonest first, past most recent first", () => {
  const events = [
    ev("b", "2026-10-14T20:00:00Z", "2026-10-14T21:00:00Z"),
    ev("a", "2026-09-02T19:00:00Z", "2026-09-02T20:00:00Z"),
    ev("d", "2026-11-03T20:00:00Z", "2026-11-03T21:00:00Z"),
    ev("c", "2026-10-01T20:00:00Z", "2026-10-01T21:00:00Z"),
  ];
  const { upcoming, past } = splitPublicEvents(events, at("2026-10-05T00:00:00Z"));
  assert.deepEqual(upcoming.map((e) => e.title), ["b", "d"]);
  assert.deepEqual(past.map((e) => e.title), ["c", "a"]);
});

test("an event that ended one minute ago is past", () => {
  const events = [ev("x", "2026-10-14T20:00:00Z", "2026-10-14T21:00:00Z")];
  const { upcoming, past } = splitPublicEvents(events, at("2026-10-14T21:01:00Z"));
  assert.deepEqual(upcoming, []);
  assert.equal(past.length, 1);
});
