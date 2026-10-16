import { NextResponse, type NextRequest } from "next/server";
import { readAdminConfig } from "@/server/admin/password";
import { passwordTag, SESSION_COOKIE, verifySession } from "@/server/admin/session";

/**
 * Runs before every page. Two jobs:
 *
 * 1. Security headers with a per-request Content Security Policy nonce.
 *    Next.js reads the CSP header during rendering and stamps the nonce on
 *    its own scripts, so no inline script runs without it.
 * 2. For /admin, no-store and noindex headers, and a redirect to the login
 *    page when the session cookie is missing or invalid. A convenience only:
 *    every admin page and action verifies the session again itself.
 */

const ADMIN_PREFIX = "/admin";
const LOGIN_PATH = "/admin/login";

function buildCsp(nonce: string): string {
  const dev = process.env.NODE_ENV === "development";
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // The homepage animation sets inline style attributes from React; nonces cannot cover attributes.
    "style-src 'self' 'unsafe-inline'",
    // Event flyers are URLs officers paste into the sheet, so images may come from any https host.
    "img-src 'self' https: data: blob:",
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
    "media-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ];
  if (!dev) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}

function applySecurityHeaders(response: NextResponse, csp: string, isAdmin: boolean) {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (isAdmin) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
}

function hasValidSession(request: NextRequest): boolean {
  const config = readAdminConfig();
  if (!config.ok) return false;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  return verifySession(token, { secret: config.secret, passwordTag: passwordTag(config.password, config.secret) }).ok;
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const path = request.nextUrl.pathname;
  const isAdmin = path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`);
  if (isAdmin && path !== LOGIN_PATH && !hasValidSession(request)) {
    const redirect = NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    applySecurityHeaders(redirect, csp, true);
    return redirect;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(response, csp, isAdmin);
  return response;
}

export const config = {
  matcher: [
    {
      /*
       * Everything except static files, the image optimizer, public assets
       * and prefetches. Those responses carry no HTML.
       */
      source: "/((?!_next/static|_next/image|assets/|favicon.ico|icon.png|apple-icon.png|.*\\.(?:png|jpg|jpeg|webp|svg|ico|json|txt|xml|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
