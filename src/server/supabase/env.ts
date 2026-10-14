import "server-only";

/**
 * Supabase connection settings. All three are server-only: nothing here is
 * ever prefixed NEXT_PUBLIC_, so no Supabase URL or key reaches the browser.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

export function supabaseUrl(): string {
  return required("SUPABASE_URL").replace(/\/+$/, "");
}

/** The publishable (anon) key: safe to use for anonymous reads, still RLS-bound. */
export function supabasePublishableKey(): string {
  return required("SUPABASE_PUBLISHABLE_KEY");
}

/** The secret (service role) key. Bypasses RLS. Only service.ts reads it. */
export function supabaseSecretKey(): string {
  return required("SUPABASE_SECRET_KEY");
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}
