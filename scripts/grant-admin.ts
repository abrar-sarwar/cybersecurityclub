/**
 * Grants the admin role to an existing account. Run it yourself, once, to
 * seed the first admin; after that, admins change roles in /admin.
 *
 *   npm run admin:grant -- you@gmail.com
 *
 * The person must have signed in once so their account exists. Uses the
 * secret key from the environment and never runs in the web app. The database
 * trigger records the change in audit_log.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

function loadDotEnv() {
  try {
    process.loadEnvFile?.(".env");
  } catch {
    // No .env file: rely on variables already in the environment.
  }
}

async function main() {
  loadDotEnv();
  const email = process.argv[2]?.trim().toLowerCase();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!email || !email.includes("@")) {
    console.error("Usage: npm run admin:grant -- <sign-in email>");
    process.exit(1);
  }
  if (!url || !secretKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY first (for example in .env).");
    process.exit(1);
  }

  const supabase = createClient<Database>(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId: string | undefined;
  for (let page = 1; !userId; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    userId = data.users.find((user) => user.email?.toLowerCase() === email)?.id;
    if (data.users.length < 1000) break;
  }
  if (!userId) {
    console.error(`No account signs in with ${email}. Ask them to sign in once, then run this again.`);
    process.exit(1);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role: "admin", membership_status: "active" })
    .eq("id", userId)
    .select("id, full_name, role")
    .single();
  if (error) throw error;

  console.log(`${data.full_name ?? email} (${data.id}) is now an admin. Remind them to turn on 2-Step Verification for their Google account.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
