import assert from "node:assert/strict";
import test from "node:test";
import { findUnsafeMarkdownLinks, isSafeHttpsUrl } from "./urls";
import { flyerAltSchema, monthParamSchema, parseEventForm } from "./schema";

const NY = "America/New_York";

const valid = {
  title: "General Body Meeting",
  description: "First meeting of the semester. [Agenda](https://example.com/agenda)",
  category: "general_meeting",
  location: "CMII 211",
  directionsUrl: "https://maps.example.com/cmii",
  registrationUrl: "https://pin.gsu.edu/event/123",
  startsLocal: "2026-09-02T15:00",
  endsLocal: "2026-09-02T16:00",
  recap: "",
  slidesUrl: "",
  recordingUrl: "",
  materialsUrl: "",
};

test("a complete form parses to instants", () => {
  const result = parseEventForm(valid, NY);
  assert.ok(result.ok);
  assert.equal(result.data.startsAt.toISOString(), "2026-09-02T19:00:00.000Z");
  assert.equal(result.data.endsAt.toISOString(), "2026-09-02T20:00:00.000Z");
  assert.equal(result.data.allDay, false);
  assert.equal(result.data.recap, null);
  assert.equal(result.data.slidesUrl, null);
});

test("FormData input is accepted and checkboxes default to false", () => {
  const form = new FormData();
  for (const [k, v] of Object.entries(valid)) form.set(k, v);
  const result = parseEventForm(form, NY);
  assert.ok(result.ok);
  assert.equal(result.data.allDay, false);
});

test("all-day events span the whole local day", () => {
  const result = parseEventForm({ ...valid, allDay: "on", startsLocal: "2026-09-11", endsLocal: "2026-09-11" }, NY);
  assert.ok(result.ok);
  assert.equal(result.data.startsAt.toISOString(), "2026-09-11T04:00:00.000Z");
  assert.equal(result.data.endsAt.toISOString(), "2026-09-12T03:59:00.000Z");
});

test("ending before starting is a field error on the end field", () => {
  const result = parseEventForm({ ...valid, endsLocal: "2026-09-02T14:00" }, NY);
  assert.ok(!result.ok);
  assert.match(result.fields.endsLocal, /end after it starts/);
});

test("missing or malformed times are field errors, not crashes", () => {
  for (const startsLocal of ["", "soon", "2026-02-30T10:00", "1999-01-01T10:00"]) {
    const result = parseEventForm({ ...valid, startsLocal }, NY);
    assert.ok(!result.ok, startsLocal);
    assert.ok(result.fields.startsLocal, startsLocal);
  }
});

test("lengths are enforced", () => {
  const long = parseEventForm({ ...valid, title: "x".repeat(121), location: "y".repeat(201), description: "z".repeat(5001) }, NY);
  assert.ok(!long.ok);
  assert.ok(long.fields.title && long.fields.location && long.fields.description);
  const short = parseEventForm({ ...valid, title: "ab", location: "" }, NY);
  assert.ok(!short.ok);
  assert.ok(short.fields.title && short.fields.location);
});

test("unknown categories and statuses are rejected", () => {
  const result = parseEventForm({ ...valid, category: "party" }, NY);
  assert.ok(!result.ok);
  assert.ok(result.fields.category);
});

test("link fields must be https", () => {
  for (const bad of ["http://pin.gsu.edu/x", "javascript:alert(1)", "ftp://x.y/z", "pin.gsu.edu", "https://user:pw@pin.gsu.edu/", "https://localhost/x", "data:text/html,hi"]) {
    const result = parseEventForm({ ...valid, registrationUrl: bad }, NY);
    assert.ok(!result.ok, bad);
    assert.ok(result.fields.registrationUrl, bad);
  }
  assert.ok(isSafeHttpsUrl("https://pin.gsu.edu/organization/cysecclub/events"));
  assert.ok(!isSafeHttpsUrl(`https://example.com/${"a".repeat(600)}`));
});

test("Markdown with unsafe link schemes is rejected", () => {
  for (const text of [
    "Click [here](javascript:alert(1))",
    "![x](data:image/svg+xml;base64,AAAA)",
    "[ref]: vbscript:msgbox\n\nsee [ref]",
    "<javascript:alert(1)>",
    "[a](JAVASCRIPT:alert(1))",
    "[b](java&#115;cript:alert(1))",
  ]) {
    assert.ok(findUnsafeMarkdownLinks(text).length > 0, text);
    const result = parseEventForm({ ...valid, description: text }, NY);
    assert.ok(!result.ok, text);
    assert.ok(result.fields.description, text);
  }
});

test("Markdown with ordinary links passes", () => {
  for (const text of ["See [PIN](https://pin.gsu.edu) and [email](mailto:club@example.com) or [old](http://example.com).", "Relative [link](/events) and [anchor](#top)", "<https://example.com/auto>", "Plain text with <b>html</b> is fine; it is never rendered as HTML."]) {
    assert.deepEqual(findUnsafeMarkdownLinks(text), [], text);
  }
});

test("flyer alt text needs substance but not an essay", () => {
  assert.ok(!flyerAltSchema.safeParse("Img").success);
  assert.ok(flyerAltSchema.safeParse("Flyer reading: General Body Meeting, September 2, CMII 211").success);
  assert.ok(!flyerAltSchema.safeParse("a".repeat(301)).success);
});

test("month parameter is strict", () => {
  assert.ok(monthParamSchema.safeParse("2026-10").success);
  for (const bad of ["2026-13", "2026-1", "26-10", "1999-01", "2026-10-01", "x"]) assert.ok(!monthParamSchema.safeParse(bad).success, bad);
});
