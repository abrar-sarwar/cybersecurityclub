import assert from "node:assert/strict";
import test from "node:test";
import { createVerificationToken, hashToken, signUnsubscribeToken, verifyUnsubscribeToken } from "./tokens";

const secret = "test-secret-that-is-long-enough-for-hmac";
const userId = "11111111-1111-4111-8111-111111111111";

test("verification tokens are random and stored only as a hash", () => {
  const token = createVerificationToken();
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.notEqual(token, createVerificationToken());
  assert.match(hashToken(token), /^[0-9a-f]{64}$/);
  assert.equal(hashToken(token), hashToken(token));
});

test("unsubscribe tokens only verify for the member and secret they were signed with", () => {
  const token = signUnsubscribeToken(secret, userId);
  assert.equal(verifyUnsubscribeToken(secret, token), userId);
  assert.equal(verifyUnsubscribeToken("another-secret-that-is-long-enough", token), null);

  const [, signature] = token.split(".");
  assert.equal(verifyUnsubscribeToken(secret, `22222222-2222-4222-8222-222222222222.${signature}`), null);
  assert.equal(verifyUnsubscribeToken(secret, `${token}.extra`), null);
  assert.equal(verifyUnsubscribeToken(secret, "not-a-token"), null);
  assert.equal(verifyUnsubscribeToken(secret, null), null);
});
