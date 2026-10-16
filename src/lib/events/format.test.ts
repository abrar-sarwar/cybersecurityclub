import assert from "node:assert/strict";
import test from "node:test";
import { eventDetail, formatClockTime, formatTimeRange, formatEventDate } from "./format";

test("clock times read like a flyer", () => {
  assert.equal(formatClockTime("15:00"), "3:00 PM");
  assert.equal(formatClockTime("00:30"), "12:30 AM");
  assert.equal(formatClockTime("12:00"), "12:00 PM");
  assert.equal(formatClockTime("09:05"), "9:05 AM");
});

test("ranges share the period when they can", () => {
  assert.equal(formatTimeRange("15:00", "16:00"), "3:00 to 4:00 PM");
  assert.equal(formatTimeRange("11:30", "13:00"), "11:30 AM to 1:00 PM");
  assert.equal(formatTimeRange("15:00", null), "3:00 PM");
  assert.equal(formatTimeRange(null, "16:00"), "Until 4:00 PM");
  assert.equal(formatTimeRange(null, null), null);
});

test("the detail line joins what exists", () => {
  assert.equal(eventDetail({ category: "Workshop", location: "CMII 211", startTime: "15:00", endTime: "16:00" }), "Workshop · CMII 211 · 3:00 to 4:00 PM");
  assert.equal(eventDetail({ category: null, location: "CMII 211", startTime: null, endTime: null }), "CMII 211");
  assert.equal(eventDetail({ category: null, location: null, startTime: null, endTime: null }), "");
});

test("formatEventDate keeps a YYYY-MM-DD day on that day whatever the server's zone", () => {
  assert.equal(formatEventDate("2026-10-21"), "Wednesday, October 21");
  assert.equal(formatEventDate("2026-10-21", { month: "short", day: "numeric" }), "Oct 21");
  assert.equal(formatEventDate("2026-10-01", { month: "long", year: "numeric" }), "October 2026");
});
