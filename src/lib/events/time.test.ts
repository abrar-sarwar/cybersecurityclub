import assert from "node:assert/strict";
import test from "node:test";
import { dayKey, offsetAt, utcToZonedLocal, zonedLocalToUtc } from "./time";

const NY = "America/New_York";

test("Eastern standard and daylight offsets", () => {
  assert.equal(offsetAt(Date.UTC(2026, 0, 15, 12), NY), -5 * 3_600_000);
  assert.equal(offsetAt(Date.UTC(2026, 6, 15, 12), NY), -4 * 3_600_000);
});

test("a winter wall time becomes the right instant", () => {
  assert.equal(zonedLocalToUtc("2026-01-15T15:00", NY).toISOString(), "2026-01-15T20:00:00.000Z");
});

test("a summer wall time becomes the right instant", () => {
  assert.equal(zonedLocalToUtc("2026-09-02T15:00", NY).toISOString(), "2026-09-02T19:00:00.000Z");
});

test("a date alone means local midnight", () => {
  assert.equal(zonedLocalToUtc("2026-09-02", NY).toISOString(), "2026-09-02T04:00:00.000Z");
});

test("the skipped spring hour resolves forward and never throws", () => {
  // 2026-03-08 02:30 does not exist in New York; clocks jump from 02:00 EST to 03:00 EDT.
  const instant = zonedLocalToUtc("2026-03-08T02:30", NY);
  assert.equal(instant.toISOString(), "2026-03-08T07:30:00.000Z");
  assert.equal(utcToZonedLocal(instant, NY), "2026-03-08T03:30");
});

test("the repeated autumn hour resolves to its first occurrence", () => {
  // 2026-11-01 01:30 happens twice; the first time is still EDT (UTC-4).
  const instant = zonedLocalToUtc("2026-11-01T01:30", NY);
  assert.equal(instant.toISOString(), "2026-11-01T05:30:00.000Z");
  assert.equal(utcToZonedLocal(instant, NY), "2026-11-01T01:30");
});

test("times around the transitions round-trip", () => {
  for (const local of ["2026-03-08T01:59", "2026-03-08T03:00", "2026-11-01T00:59", "2026-11-01T02:00", "2026-12-31T23:59", "2027-01-01T00:00"]) {
    assert.equal(utcToZonedLocal(zonedLocalToUtc(local, NY), NY), local);
  }
});

test("malformed or impossible input throws", () => {
  for (const bad of ["", "tomorrow", "2026-02-30T10:00", "2026-13-01T10:00", "2026-01-01T24:00", "2026-01-01T10:00Z"]) {
    assert.throws(() => zonedLocalToUtc(bad, NY), RangeError, bad);
  }
});

test("dayKey uses the club's day, not UTC's", () => {
  // 23:30 Eastern on the 2nd is 03:30 UTC on the 3rd.
  assert.equal(dayKey("2026-09-03T03:30:00.000Z", NY), "2026-09-02");
});
