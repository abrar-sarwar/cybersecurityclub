import assert from "node:assert/strict";
import test from "node:test";
import { createSession, passwordTag, SESSION_TTL_MS, verifySession } from "./session";

const secret = "a".repeat(64);
const pw = passwordTag("correct horse battery staple");
const t0 = 1_700_000_000_000;

test("a fresh session verifies and carries its expiry", () => {
  const token = createSession({ secret, passwordTag: pw, now: t0 });
  assert.deepEqual(verifySession(token, { secret, passwordTag: pw, now: t0 + 1000 }), { ok: true, expiresAt: t0 + SESSION_TTL_MS });
});

test("missing, malformed, tampered, expired and password-changed tokens are rejected with a reason", () => {
  const token = createSession({ secret, passwordTag: pw, now: t0 });
  const [payload, sig] = token.split(".");
  assert.deepEqual(verifySession(undefined, { secret, passwordTag: pw, now: t0 }), { ok: false, reason: "missing" });
  assert.deepEqual(verifySession("nonsense", { secret, passwordTag: pw, now: t0 }), { ok: false, reason: "malformed" });
  assert.deepEqual(verifySession(`${payload}.${sig.slice(0, -2)}xx`, { secret, passwordTag: pw, now: t0 }), { ok: false, reason: "signature" });
  assert.deepEqual(verifySession(token, { secret: "b".repeat(64), passwordTag: pw, now: t0 }), { ok: false, reason: "signature" });
  assert.deepEqual(verifySession(token, { secret, passwordTag: pw, now: t0 + SESSION_TTL_MS + 1 }), { ok: false, reason: "expired" });
  assert.deepEqual(verifySession(token, { secret, passwordTag: passwordTag("new password 123"), now: t0 }), { ok: false, reason: "password-changed" });
});

test("the password tag does not reveal the password", () => {
  assert.match(pw, /^[0-9a-f]{12}$/);
  assert.notEqual(passwordTag("x"), passwordTag("y"));
});
