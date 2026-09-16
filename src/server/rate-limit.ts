import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { keyedHash } from "@/lib/tokens";
import { appSecret } from "@/server/env";

/** Limits are per bucket; windows are in seconds (at most one day). */
export const LIMITS = {
  magicLinkPerIp: { bucket: "magic_link:ip", max: 5, window: 600 },
  magicLinkPerEmail: { bucket: "magic_link:email", max: 3, window: 3600 },
  verificationPerUser: { bucket: "student_verification:user", max: 3, window: 3600 },
  verificationPerUserDaily: { bucket: "student_verification:user_daily", max: 8, window: 86400 },
  verificationPerIp: { bucket: "student_verification:ip", max: 10, window: 3600 },
  verificationConfirmPerUser: { bucket: "student_verification_confirm:user", max: 20, window: 600 },
  staffSensitivePerActor: { bucket: "staff_sensitive:actor", max: 20, window: 3600 },
  unsubscribePerIp: { bucket: "unsubscribe:ip", max: 30, window: 600 },
} as const;

export type Limit = (typeof LIMITS)[keyof typeof LIMITS];

/**
 * The client IP as set by the hosting platform (Vercel sets both headers and
 * overwrites client-supplied values). Behind another proxy, make sure it
 * replaces these headers rather than appending to them. Null when unknown.
 */
export async function clientIp() {
  const h = await headers();
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

/**
 * Per-IP limit. Skipped when no IP is available, so visitors are never lumped
 * into one shared bucket that anyone could exhaust; per-user and per-email
 * limits still apply in that case.
 */
export async function hitIpRateLimit(limit: Limit) {
  const ip = await clientIp();
  return ip ? hitRateLimit(limit, ip) : true;
}

/**
 * Records a hit and returns true while the subject is under the limit.
 * Subjects are stored as keyed hashes. Fails closed: if the limiter cannot be
 * reached, the action is refused rather than left unlimited.
 */
export async function hitRateLimit(limit: Limit, subject: string) {
  try {
    const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
      p_bucket: limit.bucket,
      p_subject: keyedHash(appSecret(), subject),
      p_max: limit.max,
      p_window_seconds: limit.window,
    });
    if (error) throw error;
    return data === true;
  } catch (error) {
    console.error("[rate-limit] check failed", limit.bucket, error);
    return false;
  }
}
