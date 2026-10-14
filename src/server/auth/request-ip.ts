import "server-only";
import { headers } from "next/headers";

/**
 * The caller's address for rate limiting. Vercel sets x-forwarded-for and
 * x-real-ip at its edge; locally there is none, so "local" is used.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  const forwarded = h.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || "local";
}
