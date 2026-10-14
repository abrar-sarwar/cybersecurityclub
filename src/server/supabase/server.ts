import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { sessionCookieOptions } from "./cookie-options";
import { supabasePublishableKey, supabaseUrl } from "./env";

/**
 * A Supabase client bound to the current request's session cookies. Queries
 * run as the signed-in officer, so Row Level Security and the audit triggers
 * see the real actor. Create one per request; never cache it.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    cookieOptions: sessionCookieOptions(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the
          // session on every admin request, so nothing is lost.
        }
      },
    },
  });
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
