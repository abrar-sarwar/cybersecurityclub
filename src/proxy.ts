import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Refreshes the Supabase session cookie on every page request and sends
 * signed-out visitors away from member areas. This is only the first gate:
 * every private page and server action checks the session, profile and role
 * again on the server (src/server/session.ts).
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/settings",
  "/admin",
  "/questionnaire",
  "/projects",
  "/lab-setup",
  "/certifications",
  "/interview-prep",
  "/account",
];

function isProtected(pathname: string) {
  return (
    PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) ||
    /^\/learn\/paths\/[^/]+\/[^/]+\/[^/]+/.test(pathname)
  );
}

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!userId && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/join";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Every route except static assets and image optimization.
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|json)$).*)",
  ],
};
