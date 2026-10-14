import "server-only";
import { createSupabaseServiceClient } from "@/server/supabase/service";

/**
 * Fixed-window rate limits stored in Postgres (public.hit_rate_limit, service
 * role only). One source of truth across every serverless instance, with no
 * extra service to run. If the counter cannot be reached the request is
 * refused: when the database is down nothing else works either.
 */
export const RATE_LIMITS = {
  /** Sign-in attempts per address and per account. */
  loginPerIp: { limit: 20, windowSeconds: 600 },
  loginPerEmail: { limit: 8, windowSeconds: 900 },
  /** MFA code attempts per account. */
  mfaPerUser: { limit: 10, windowSeconds: 600 },
  /** Password resets requested per address. */
  resetPerIp: { limit: 5, windowSeconds: 3600 },
  /** Event writes per officer. */
  writePerUser: { limit: 120, windowSeconds: 600 },
  /** Flyer uploads per officer. */
  uploadPerUser: { limit: 20, windowSeconds: 600 },
  /** Administrator changes per owner. */
  adminPerUser: { limit: 20, windowSeconds: 3600 },
} as const;

export type RateLimitRule = { limit: number; windowSeconds: number };

/** True when the call is within the limit; false when it should be refused. */
export async function withinRateLimit(scope: string, subject: string, rule: RateLimitRule): Promise<boolean> {
  const key = `${scope}:${subject}`.slice(0, 200);
  try {
    const service = createSupabaseServiceClient();
    const { data, error } = await service.rpc("hit_rate_limit", { p_key: key, p_limit: rule.limit, p_window_seconds: rule.windowSeconds });
    if (error) {
      console.error("[rate-limit] counter unavailable:", error.message);
      return false;
    }
    return data === true;
  } catch (err) {
    console.error("[rate-limit] counter unavailable:", (err as Error).message);
    return false;
  }
}

export const RATE_LIMITED_MESSAGE = "Too many attempts. Wait a few minutes and try again.";
