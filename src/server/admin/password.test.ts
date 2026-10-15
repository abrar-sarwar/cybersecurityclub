import assert from "node:assert/strict";
import test from "node:test";
import { comparePassword, readAdminConfig } from "./password";

test("config needs a 12+ character password and a 32+ byte hex secret", () => {
  const ok = readAdminConfig({ ADMIN_PASSWORD: "correct horse battery", ADMIN_SESSION_SECRET: "f".repeat(64) });
  assert.deepEqual(ok, { ok: true, password: "correct horse battery", secret: "f".repeat(64) });
  assert.deepEqual(readAdminConfig({}), { ok: false, missing: ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET"] });
  assert.deepEqual(readAdminConfig({ ADMIN_PASSWORD: "short", ADMIN_SESSION_SECRET: "f".repeat(64) }), { ok: false, missing: ["ADMIN_PASSWORD"] });
  assert.deepEqual(readAdminConfig({ ADMIN_PASSWORD: "correct horse battery", ADMIN_SESSION_SECRET: "tooshort" }), { ok: false, missing: ["ADMIN_SESSION_SECRET"] });
});

test("comparePassword accepts only the exact password", () => {
  assert.equal(comparePassword("correct horse battery", "correct horse battery"), true);
  assert.equal(comparePassword("correct horse batterY", "correct horse battery"), false);
  assert.equal(comparePassword("", "correct horse battery"), false);
  assert.equal(comparePassword("correct horse battery ", "correct horse battery"), false);
});
