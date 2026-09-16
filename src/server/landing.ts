import "server-only";
import { isProfileComplete } from "@/lib/portal";
import type { createClient } from "@/lib/supabase/server";

/**
 * Where a freshly signed-in member should land: onboarding until the profile
 * is complete, otherwise the requested page or the dashboard.
 */
export async function landingPath(supabase: Awaited<ReturnType<typeof createClient>>, next: string) {
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (typeof userId !== "string") return "/join?error=link";

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, student_email, grad_month, grad_year")
    .eq("id", userId)
    .maybeSingle();
  if (!profile || !isProfileComplete(profile)) return "/onboarding";
  return next;
}
