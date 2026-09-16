import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/portal";
import { siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { landingPath } from "@/server/landing";

/**
 * PKCE code exchange for Google sign-in and for magic links sent with the
 * default email template. Redirects are built from APP_URL, never from
 * request headers.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const base = siteUrl();

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(await landingPath(supabase, next), base));
      console.error("[auth/callback] code exchange failed", error.message);
    } catch (error) {
      console.error("[auth/callback] sign-in failed", error);
    }
  }

  const reason = searchParams.get("error") ? "cancelled" : "link";
  return NextResponse.redirect(new URL(`/join?error=${reason}&next=${encodeURIComponent(next)}`, base));
}
