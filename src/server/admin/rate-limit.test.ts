import assert from "node:assert/strict";
import test from "node:test";
import { createRateLimiter } from "./rate-limit";

test("allows `limit` hits per window per key, then refuses with a retry time, then recovers", () => {
  let clock = 0;
  const limiter = createRateLimiter({ limit: 3, windowMs: 1000, now: () => clock });
  assert.equal(limiter.hit("a").ok, true);
  assert.equal(limiter.hit("a").ok, true);
  assert.equal(limiter.hit("a").ok, true);
  const refused = limiter.hit("a");
  assert.equal(refused.ok, false);
  assert.equal(refused.retryAfterMs, 1000);
  assert.equal(limiter.hit("b").ok, true);
  clock = 1001;
  assert.equal(limiter.hit("a").ok, true);
});

test("reset forgets a key and the key count is capped", () => {
  const limiter = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0, maxKeys: 2 });
  limiter.hit("a");
  assert.equal(limiter.hit("a").ok, false);
  limiter.reset("a");
  assert.equal(limiter.hit("a").ok, true);
  limiter.hit("b");
  limiter.hit("c"); // evicts the oldest key rather than growing forever
  assert.equal(limiter.hit("a").ok, true);
});
