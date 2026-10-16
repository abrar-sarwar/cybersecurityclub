/**
 * The admin session cookie value: `base64url(JSON{exp, pw}).base64url(HMAC-SHA256)`.
 * `pw` is a short hash of the current password, so changing the password
 * invalidates every session. Pure: usable from the proxy and from tests.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "admin_session";
export const SESSION_TTL_MS = 12 * 3_600_000;

type Payload = { exp: number; pw: string };

/** A short, keyed fingerprint of the password: nothing password-derived is in the cookie without the secret. */
export function passwordTag(password: string, secret: string): string {
  return createHmac("sha256", secret).update(password).digest("hex").slice(0, 16);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSession(opts: { secret: string; passwordTag: string; now?: number }): string {
  const exp = (opts.now ?? Date.now()) + SESSION_TTL_MS;
  const payload = Buffer.from(JSON.stringify({ exp, pw: opts.passwordTag } satisfies Payload)).toString("base64url");
  return `${payload}.${sign(payload, opts.secret)}`;
}

export function verifySession(
  token: string | undefined,
  opts: { secret: string; passwordTag: string; now?: number },
): { ok: true; expiresAt: number } | { ok: false; reason: "missing" | "malformed" | "signature" | "expired" | "password-changed" } {
  if (!token) return { ok: false, reason: "missing" };
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "malformed" };
  const [payload, signature] = parts;
  const expected = Buffer.from(sign(payload, opts.secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "signature" };
  let data: Payload;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Payload;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (typeof data.exp !== "number" || typeof data.pw !== "string") return { ok: false, reason: "malformed" };
  if (data.exp <= (opts.now ?? Date.now())) return { ok: false, reason: "expired" };
  if (data.pw !== opts.passwordTag) return { ok: false, reason: "password-changed" };
  return { ok: true, expiresAt: data.exp };
}
