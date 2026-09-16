import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Public Supabase settings. The publishable key is designed to be public: it
 * only reaches what row level security allows. Returns null until configured
 * so public pages keep rendering when auth is not set up yet.
 */
export function supabasePublicConfig() {
  const url = runtimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = runtimeEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  return url && publishableKey ? { url, publishableKey } : null;
}

/**
 * Reads a variable when the server runs. A dynamic lookup is deliberate:
 * Next.js freezes literal `process.env.NEXT_PUBLIC_*` references at build
 * time, and these values are only ever used on the server.
 */
export function runtimeEnv(name: string) {
  return process.env[name] || undefined;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
    this.name = "SupabaseNotConfiguredError";
  }
}

/**
 * Session cookies are httpOnly: the portal never reads the session in the
 * browser, so scripts on the page cannot either. Secure whenever the site is
 * served over HTTPS.
 */
export function authCookieOptions(): CookieOptionsWithName {
  const appUrl = runtimeEnv("APP_URL") ?? "";
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: appUrl.startsWith("https://"),
    path: "/",
  };
}
