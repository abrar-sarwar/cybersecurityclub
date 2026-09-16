import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** 256-bit random token, URL-safe (43 characters). Only its hash is stored. */
export function createVerificationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Keyed hash for identifiers we must not store raw, such as IP addresses. */
export function keyedHash(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

function unsubscribeSignature(secret: string, userId: string) {
  return createHmac("sha256", secret).update(`unsubscribe:events:${userId}`).digest("base64url");
}

/** Long-lived link token that can only turn event emails off for one member. */
export function signUnsubscribeToken(secret: string, userId: string) {
  return `${userId}.${unsubscribeSignature(secret, userId)}`;
}

export function verifyUnsubscribeToken(secret: string, token: unknown): string | null {
  if (typeof token !== "string" || token.length > 200) return null;
  const [userId, signature, extra] = token.split(".");
  if (extra !== undefined || !userId || !signature || !UUID.test(userId)) return null;
  const expected = Buffer.from(unsubscribeSignature(secret, userId));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  return userId;
}
