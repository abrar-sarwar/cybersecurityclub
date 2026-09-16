import assert from "node:assert/strict";
import test from "node:test";
import { isProfileComplete, roleAtLeast, safeNextPath } from "./portal";
import {
  eventSchema,
  memberSearchSchema,
  onboardingSchema,
  settingsSchema,
  signInEmailSchema,
  studentEmailSchema,
} from "./portal-schemas";

test("post-sign-in redirects stay on this site", () => {
  assert.equal(safeNextPath("/admin/members?q=ana"), "/admin/members?q=ana");
  assert.equal(safeNextPath(undefined), "/dashboard");
  assert.equal(safeNextPath("/admin/../dashboard"), "/dashboard");
  for (const hostile of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/.//evil.test",
    "/%2e//evil.test",
    "/a/..//evil.test",
    "/%2E%2E//evil.test",
    "javascript:alert(1)",
    "evil.test",
    "/\u0000x",
  ]) {
    assert.equal(safeNextPath(hostile), "/dashboard", hostile);
  }
});

test("student emails must be GSU student addresses", () => {
  assert.equal(studentEmailSchema.parse("  PantherID1@Student.GSU.edu "), "pantherid1@student.gsu.edu");
  for (const bad of ["someone@gsu.edu", "someone@gmail.com", "x@student.gsu.edu.evil.com", "x@evilstudent.gsu.edu", "not-an-email"]) {
    assert.equal(studentEmailSchema.safeParse(bad).success, false, bad);
  }
});

test("the email sign-in fallback asks for a personal address", () => {
  assert.equal(signInEmailSchema.parse({ email: "Me@Gmail.com" }).email, "me@gmail.com");
  assert.equal(signInEmailSchema.safeParse({ email: "me@student.gsu.edu" }).success, false);
  assert.equal(signInEmailSchema.parse({ email: "me@gmail.com", next: "//evil.test" }).next, "/dashboard");
});

test("onboarding accepts only the collected fields and cleans them", () => {
  const parsed = onboardingSchema.parse({
    full_name: "  Ada Lovelace ",
    student_email: "alovelace1@student.gsu.edu",
    grad_month: "5",
    grad_year: "2028",
    major: "   ",
    interests: ["ctfs", "osint", "ctfs"],
    notify_events: null,
    role: "admin",
  });
  assert.deepEqual(parsed, {
    full_name: "Ada Lovelace",
    student_email: "alovelace1@student.gsu.edu",
    grad_month: 5,
    grad_year: 2028,
    major: null,
    interests: ["ctfs", "osint"],
    notify_events: false,
  });
  assert.equal("role" in parsed, false);
  assert.equal(onboardingSchema.safeParse({ ...parsed, grad_month: "13" }).success, false);
  assert.equal(settingsSchema.safeParse({ ...parsed, interests: ["lockpicking"] }).success, false);
  assert.equal(settingsSchema.parse({ ...parsed, notify_events: "on" }).notify_events, true);
});

test("event times are read in club time and must end after they start", () => {
  const parsed = eventSchema.parse({ title: "CTF night", description: "", location: "", starts_at: "2026-10-01T18:00", ends_at: "" });
  assert.equal(parsed.starts_at.toISOString(), "2026-10-01T22:00:00.000Z");
  assert.equal(parsed.ends_at, null);
  assert.equal(
    eventSchema.safeParse({ title: "x", description: "", location: "", starts_at: "2026-10-01T18:00", ends_at: "2026-10-01T17:00" }).success,
    false,
  );
});

test("member search strips filter syntax from the query", () => {
  const parsed = memberSearchSchema.parse({ q: 'ana,role.eq.admin)"*', verified: "maybe", page: "-3" });
  assert.equal(parsed.q, "anarole.eq.admin");
  assert.doesNotMatch(parsed.q, /[,()"*%\\]/);
  assert.equal(parsed.verified, "all");
  assert.equal(parsed.page, 1);
});

test("profile completeness and role order", () => {
  assert.equal(isProfileComplete({ full_name: "A", student_email: "a@student.gsu.edu", grad_month: 5, grad_year: 2028 }), true);
  assert.equal(isProfileComplete({ full_name: "A", student_email: null, grad_month: 5, grad_year: 2028 }), false);
  assert.equal(roleAtLeast("admin", "officer"), true);
  assert.equal(roleAtLeast("member", "officer"), false);
});
