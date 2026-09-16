import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authCookieOptions, SupabaseNotConfiguredError, supabasePublicConfig } from "./config";
import type { Database } from "./database.types";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers,
 * acting as the signed-in member (row level security applies).
 * Create a new client per request; never store it in a module variable.
 */
export async function createClient() {
  // Read cookies before anything else so every caller renders per request,
  // even when the build environment has no Supabase settings.
  const cookieStore = await cookies();
  const config = supabasePublicConfig();
  if (!config) throw new SupabaseNotConfiguredError();

  return createServerClient<Database>(config.url, config.publishableKey, {
    cookieOptions: authCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. The proxy refreshes sessions.
        }
      },
    },
  });
}
