import { createHash, timingSafeEqual } from "node:crypto";

const MIN_PASSWORD = 12;
const MIN_SECRET = 64; // 32 bytes as hex

/** The two secrets the admin page needs. Short values count as missing so a weak setup never runs. */
export function readAdminConfig(env: Record<string, string | undefined> = process.env): { ok: true; password: string; secret: string } | { ok: false; missing: string[] } {
  const password = env.ADMIN_PASSWORD ?? "";
  const secret = env.ADMIN_SESSION_SECRET?.trim() ?? "";
  const missing: string[] = [];
  if (password.length < MIN_PASSWORD) missing.push("ADMIN_PASSWORD");
  if (secret.length < MIN_SECRET) missing.push("ADMIN_SESSION_SECRET");
  if (missing.length) return { ok: false, missing };
  return { ok: true, password, secret };
}

/** Constant time: both sides are hashed to equal length before comparison. */
export function comparePassword(submitted: string, expected: string): boolean {
  const a = createHash("sha256").update(submitted).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b) && submitted.length === expected.length;
}
