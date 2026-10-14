import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseSecretKey, supabaseUrl } from "./env";

/**
 * The service-role client. It bypasses Row Level Security, so it is used only
 * where the signed-in officer's own client cannot work:
 *   - inviting, banning and resetting MFA for other accounts (Auth admin API)
 *   - rate-limit counters and audit entries for auth events (service-only RPCs)
 * Every caller checks authorization itself before touching this client.
 */
export function createSupabaseServiceClient() {
  return createClient<Database>(supabaseUrl(), supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
