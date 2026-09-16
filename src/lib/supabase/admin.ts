import "server-only";
import { createClient } from "@supabase/supabase-js";
import { runtimeEnv, supabasePublicConfig, SupabaseNotConfiguredError } from "./config";
import type { Database } from "./database.types";

/**
 * Privileged client using the secret key. It bypasses row level security, so
 * use it only after the caller has been authorized in server code, and only
 * for the operations members cannot do themselves (issuing verification
 * tokens, rate limiting, event email recipients, one-click unsubscribe).
 *
 * The `server-only` import makes any client component that imports this
 * module fail the build.
 */
export function createAdminClient() {
  const config = supabasePublicConfig();
  const secretKey = runtimeEnv("SUPABASE_SECRET_KEY");
  if (!config || !secretKey) throw new SupabaseNotConfiguredError();

  return createClient<Database>(config.url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
