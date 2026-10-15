import assert from "node:assert/strict";
import test from "node:test";
import { SheetStructureError } from "@/lib/events/sheet";
import { BackoffError, createEventsReader, sheetCacheKey } from "./events-reader";

const HEADER = ["event_id", "title", "date", "published"];
const good = [HEADER, ["a", "Alpha", "2026-09-02", true]];
const withBadRow = [HEADER, ["a", "Alpha", "2026-09-02", true], ["", "No id", "2026-09-03", true]];

function logger() {
  const lines: string[] = [];
  const log = { info: (m: string) => lines.push(`info ${m}`), warn: (m: string) => lines.push(`warn ${m}`), error: (m: string) => lines.push(`error ${m}`) };
  return { lines, log };
}

test("a successful read returns the published events and logs the row problems", async () => {
  const { lines, log } = logger();
  const read = createEventsReader({ fetchValues: async () => withBadRow, timeZone: "America/New_York", label: "abc…", log });
  const events = await read();
  assert.deepEqual(
    events.map((e) => e.id),
    ["a"],
  );
  assert.ok(lines.some((l) => l.startsWith("warn [events] sheet abc… row 3 event_id")), lines.join("\n"));
  assert.ok(lines.some((l) => l === "info [events] read 1 published event(s) from sheet abc…"), lines.join("\n"));
});

test("after a failure the reader does not call Google again for 30 seconds and logs the failure once", async () => {
  const { lines, log } = logger();
  let clock = 1_000_000;
  let calls = 0;
  const read = createEventsReader({
    fetchValues: async () => {
      calls++;
      throw new Error("ECONNRESET");
    },
    timeZone: "America/New_York",
    label: "abc…",
    log,
    now: () => clock,
  });
  await assert.rejects(read(), /ECONNRESET/);
  assert.equal(calls, 1);
  clock += 10_000;
  await assert.rejects(read(), BackoffError);
  assert.equal(calls, 1);
  clock += 21_000;
  await assert.rejects(read(), /ECONNRESET/);
  assert.equal(calls, 2);
  assert.equal(lines.filter((l) => l.startsWith("error [events] could not load the events sheet abc…")).length, 2);
});

test("after a good read the reader serves the last good list through an outage", async () => {
  const { log } = logger();
  let clock = 0;
  let fail = false;
  let calls = 0;
  const read = createEventsReader({
    fetchValues: async () => {
      calls++;
      if (fail) throw new Error("503");
      return good;
    },
    timeZone: "America/New_York",
    label: "abc…",
    log,
    now: () => clock,
  });
  const first = await read();
  assert.equal(first[0].id, "a");
  fail = true;
  clock += 400_000;
  const during = await read();
  assert.deepEqual(during, first);
  assert.equal(calls, 2);
  clock += 10_000;
  assert.deepEqual(await read(), first);
  assert.equal(calls, 2);
});

test("a sheet with no usable header is a failure, not an empty calendar", async () => {
  const { lines, log } = logger();
  const read = createEventsReader({ fetchValues: async () => [["Notes"], ["x"]], timeZone: "America/New_York", label: "abc…", log });
  await assert.rejects(read(), SheetStructureError);
  assert.ok(lines.some((l) => l.startsWith("error [events] could not load the events sheet abc…: SheetStructureError")), lines.join("\n"));
});

test("the cache key identifies the sheet without carrying its ID", () => {
  const key = sheetCacheKey("1abcDEFghijkl", "Events");
  assert.match(key, /^[0-9a-f]{16}$/);
  assert.ok(!key.includes("1abcDEF"));
  assert.equal(key, sheetCacheKey("1abcDEFghijkl", "Events"));
  assert.notEqual(key, sheetCacheKey("1abcDEFghijkl", "Spring"));
  assert.notEqual(key, sheetCacheKey("other", "Events"));
});
