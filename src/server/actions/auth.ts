"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/portal";
import { fieldErrors, signInEmailSchema } from "@/lib/portal-schemas";
import { absoluteUrl } from "@/lib/site";
import { SupabaseNotConfiguredError } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { landingPath } from "@/server/landing";
import { hitIpRateLimit, hitRateLimit, LIMITS } from "@/server/rate-limit";

export type MagicLinkState = {
  status: "idle" | "sent" | "error";
  message?: string;
  email?: string;
};

function callbackUrl(next: string) {
  return absoluteUrl(`/auth/callback?next=${encodeURIComponent(next)}`);
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  let url: string | undefined;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl(next), queryParams: { prompt: "select_account" } },
    });
    if (error) console.error("[auth] Google sign-in could not start", error.message);
    url = data?.url ?? undefined;
  } catch (error) {
    if (!(error instanceof SupabaseNotConfiguredError)) throw error;
  }
  redirect(url ?? `/join?error=google&next=${encodeURIComponent(next)}`);
}

export async function sendMagicLink(_previous: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const parsed = signInEmailSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { status: "error", message: fieldErrors(parsed.error).email ?? "Enter a valid email address." };
  }
  const { email, next } = parsed.data;

  if (!(await hitIpRateLimit(LIMITS.magicLinkPerIp)) || !(await hitRateLimit(LIMITS.magicLinkPerEmail, email))) {
    return { status: "error", message: "Too many sign-in links were requested. Wait a few minutes and try again.", email };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(next), shouldCreateUser: true },
    });
    if (error) {
      console.error("[auth] magic link failed", error.status, error.message);
      return {
        status: "error",
        message: error.status === 429 ? "Too many sign-in links were requested. Wait a minute and try again." : "We could not send a sign-in link right now. Try again or use Google.",
        email,
      };
    }
  } catch (error) {
    if (!(error instanceof SupabaseNotConfiguredError)) throw error;
    return { status: "error", message: "Sign-in is not available yet.", email };
  }

  // Same response whether or not the address already has an account.
  return { status: "sent", email };
}

const EMAIL_LINK_TYPES = new Set<EmailOtpType>(["magiclink", "email", "signup"]);

/**
 * Finishes a token-hash email sign-in. Runs on a button press rather than on
 * page load, so a link opened by a mail scanner or planted by someone else
 * cannot quietly sign this browser in.
 */
export async function confirmEmailSignIn(formData: FormData) {
  const next = safeNextPath(formData.get("next"));
  const tokenHash = formData.get("token_hash");
  const type = formData.get("type") as EmailOtpType | null;

  if (typeof tokenHash === "string" && /^[A-Za-z0-9_-]{8,256}$/.test(tokenHash) && type && EMAIL_LINK_TYPES.has(type)) {
    let destination: string | null = null;
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      if (error) console.error("[auth/confirm] verification failed", error.message);
      else destination = await landingPath(supabase, next);
    } catch (error) {
      if (!(error instanceof SupabaseNotConfiguredError)) throw error;
    }
    if (destination) redirect(destination);
  }
  redirect(`/join?error=link&next=${encodeURIComponent(next)}`);
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    if (!(error instanceof SupabaseNotConfiguredError)) throw error;
  }
  redirect("/");
}
