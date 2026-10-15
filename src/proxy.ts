import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieOptions } from "@/server/supabase/cookie-options";

/**
 * Runs before every page. Two jobs:
 *
 * 1. Security headers with a per-request Content Security Policy nonce. Next.js
 *    reads the CSP header during rendering and stamps the nonce on its own
 *    scripts, so no inline script runs without it.
 * 2. For admin and auth routes, refresh the Supabase session cookie and send
 *    signed-out visitors to the login page. This is a convenience: every admin
 *    page and action verifies the session again on its own.
 */

const ADMIN_PREFIX = "/admin";
const AUTH_PREFIX = "/auth";
const LOGIN_PATHS = new Set(["/admin/login", "/admin/forgot"]);

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

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const path = request.nextUrl.pathname;
  const isAdmin = path === ADMIN_PREFIX || path.startsWith(`${ADMIN_PREFIX}/`);
  const isAuth = path === AUTH_PREFIX || path.startsWith(`${AUTH_PREFIX}/`);

  if ((isAdmin || isAuth) && process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY) {
    try {
      const supabase = createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
        cookieOptions: sessionCookieOptions(),
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
            response = NextResponse.next({ request: { headers: requestHeaders } });
            for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
            for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
          },
        },
      });
      // Refreshes the session when needed and writes the new cookies to `response`.
      const { data } = await supabase.auth.getClaims();
      const signedIn = Boolean(data?.claims?.sub);
      if (isAdmin && !signedIn && !LOGIN_PATHS.has(path)) {
        const redirect = NextResponse.redirect(new URL("/admin/login", request.url));
        for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
        for (const header of ["cache-control", "expires", "pragma"]) {
          const value = response.headers.get(header);
          if (value) redirect.headers.set(header, value);
        }
        applySecurityHeaders(redirect, csp, true);
        return redirect;
      }
    } catch (err) {
      console.error("[proxy] session refresh failed:", (err as Error).message);
    }
  }

  applySecurityHeaders(response, csp, isAdmin);
  return response;
}

export const config = {
  matcher: [
    {
      /*
       * Everything except static files, the image optimizer, flyer streaming,
       * public assets and prefetches. Those responses carry no HTML.
       */
      source: "/((?!_next/static|_next/image|flyers/|assets/|favicon.ico|icon.png|apple-icon.png|.*\\.(?:png|jpg|jpeg|webp|svg|ico|json|txt|xml|woff2?)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
