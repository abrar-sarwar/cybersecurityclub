import assert from "node:assert/strict";
import test from "node:test";
import { calendarMonth, classifyEvent, daysSpanned, parseMonthParam, splitPublicEvents } from "./public";

const NY = "America/New_York";
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

test("days spanned follow the club's calendar", () => {
  // 11pm to 1am Eastern crosses a local day boundary.
  assert.deepEqual(daysSpanned(ev("late", "2026-09-03T03:00:00Z", "2026-09-03T05:00:00Z"), NY), ["2026-09-02", "2026-09-03"]);
  // Ending exactly at local midnight does not touch the next day.
  assert.deepEqual(daysSpanned(ev("edge", "2026-09-02T22:00:00Z", "2026-09-03T04:00:00Z"), NY), ["2026-09-02"]);
  // An all-day event (00:00 to 23:59 local) is one day.
  assert.deepEqual(daysSpanned(ev("allday", "2026-09-11T04:00:00Z", "2026-09-12T03:59:00Z"), NY), ["2026-09-11"]);
});

test("the calendar grid starts on Sunday and covers the month", () => {
  const events = [
    ev("gbm", "2026-09-02T19:00:00Z", "2026-09-02T20:00:00Z"),
    ev("hack", "2026-09-26T13:00:00Z", "2026-09-27T21:00:00Z"),
    ev("oct", "2026-10-01T19:00:00Z", "2026-10-01T20:00:00Z"),
  ];
  const cal = calendarMonth(events, 2026, 9, NY, at("2026-09-15T12:00:00Z"));
  assert.equal(cal.label, "September 2026");
  assert.equal(cal.prev, "2026-08");
  assert.equal(cal.next, "2026-10");
  assert.equal(cal.weeks.length, 5);
  assert.equal(cal.weeks[0][0].key, "2026-08-30"); // Sunday before the 1st
  assert.equal(cal.weeks[0][0].inMonth, false);
  const day = (key: string) => cal.weeks.flat().find((d) => d.key === key)!;
  assert.deepEqual(day("2026-09-02").events.map((e) => e.title), ["gbm"]);
  assert.deepEqual(day("2026-09-26").events.map((e) => e.title), ["hack"]);
  assert.deepEqual(day("2026-09-27").events.map((e) => e.title), ["hack"]);
  assert.equal(day("2026-09-15").isToday, true);
  assert.deepEqual(day("2026-10-01").events.map((e) => e.title), ["oct"]); // trailing cell still shows its events
});

test("December rolls into the next year", () => {
  const cal = calendarMonth([], 2026, 12, NY, at("2026-12-01T12:00:00Z"));
  assert.equal(cal.next, "2027-01");
  assert.equal(cal.prev, "2026-11");
});

test("month parameter falls back to the current club month", () => {
  const now = at("2026-10-01T02:00:00Z"); // still September 30 in New York
  assert.deepEqual(parseMonthParam(undefined, now, NY), { year: 2026, month: 9 });
  assert.deepEqual(parseMonthParam("2026-13", now, NY), { year: 2026, month: 9 });
  assert.deepEqual(parseMonthParam(["2026-11"], now, NY), { year: 2026, month: 11 });
  assert.deepEqual(parseMonthParam("1999-01", now, NY), { year: 2026, month: 9 });
});
