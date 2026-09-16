import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic redirect for signed-out visitors hitting private areas.
 * This only checks for the presence of the session cookie; every private page
 * and API route performs the real session, membership and role checks on the
 * server (see src/server/session.ts).
 */
const PRIVATE_PREFIXES = [
  "/dashboard",
  "/questionnaire",
  "/projects",
  "/lab-setup",
  "/certifications",
  "/interview-prep",
  "/account",
  "/pending",
  "/admin",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate =
    PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    /^\/learn\/paths\/[^/]+\/[^/]+\/[^/]+/.test(pathname);
  if (!isPrivate) return NextResponse.next();

  const cookie = getSessionCookie(request);
  if (cookie) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/sign-in";
  url.search = `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/questionnaire/:path*",
    "/projects/:path*",
    "/lab-setup/:path*",
    "/certifications/:path*",
    "/interview-prep/:path*",
    "/account/:path*",
    "/pending",
    "/admin/:path*",
    "/learn/paths/:path*",
  ],
};
