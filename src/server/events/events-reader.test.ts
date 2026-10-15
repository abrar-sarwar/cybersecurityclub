import assert from "node:assert/strict";
import test from "node:test";
import type { ClubEvent } from "@/lib/events/event";
import { BackoffError, createEventsReader, storeCacheKey } from "./events-reader";

const event = (id: string): ClubEvent => ({ id, title: id, description: null, category: null, date: "2026-09-02", startTime: null, endTime: null, startsAt: "2026-09-02T04:00:00.000Z", endsAt: "2026-09-03T03:59:00.000Z", location: null, imageUrl: null, imageAlt: null, registrationUrl: null, status: "upcoming", published: true });
const good = { events: [event("a")], problems: [] };

function logger() {
  const lines: string[] = [];
  const log = { info: (m: string) => lines.push(`info ${m}`), warn: (m: string) => lines.push(`warn ${m}`), error: (m: string) => lines.push(`error ${m}`) };
  return { lines, log };
}

test("a successful read returns the events and logs the problems", async () => {
  const { lines, log } = logger();
  const read = createEventsReader({ fetchEvents: async () => ({ events: [event("a")], problems: ["no-id title: Required"] }), label: "db", log });
  assert.deepEqual((await read()).map((e) => e.id), ["a"]);
  assert.ok(lines.includes("warn [events] db: no-id title: Required"), lines.join("\n"));
  assert.ok(lines.includes("info [events] read 1 published event(s) from db"), lines.join("\n"));
});

test("after a failure the reader does not call the store again for 30 seconds and logs the failure once", async () => {
  const { lines, log } = logger();
  let clock = 1_000_000;
  let calls = 0;
  const read = createEventsReader({
    fetchEvents: async () => {
      calls++;
      throw new Error("ECONNRESET");
    },
    label: "db",
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
  assert.equal(lines.filter((l) => l.startsWith("error [events] could not load events from db")).length, 2);
});

test("after a good read the reader serves the last good list through an outage", async () => {
  const { log } = logger();
  let clock = 0;
  let fail = false;
  let calls = 0;
  const read = createEventsReader({
    fetchEvents: async () => {
      calls++;
      if (fail) throw new Error("503");
      return good;
    },
    label: "db",
    log,
    now: () => clock,
  });
  const first = await read();
  assert.equal(first[0].id, "a");
  fail = true;
  clock += 400_000;
  assert.deepEqual(await read(), first);
  assert.equal(calls, 2);
  clock += 10_000;
  assert.deepEqual(await read(), first);
  assert.equal(calls, 2);
});

test("the cache key hides the store address and separates stores", () => {
  const key = storeCacheKey("https://abc.supabase.co");
  assert.match(key, /^[0-9a-f]{16}$/);
  assert.ok(!key.includes("abc"));
  assert.equal(key, storeCacheKey("https://abc.supabase.co"));
  assert.notEqual(key, storeCacheKey("https://xyz.supabase.co"));
});

test("describeError names the underlying cause when a fetch fails", async () => {
  const { describeError } = await import("./events-reader");
  const err = new TypeError("fetch failed", { cause: Object.assign(new Error("getaddrinfo ENOTFOUND x"), { code: "ENOTFOUND" }) });
  assert.equal(describeError(err), "TypeError: fetch failed (cause: ENOTFOUND getaddrinfo ENOTFOUND x)");
  assert.equal(describeError(new Error("plain")), "Error: plain");
});
