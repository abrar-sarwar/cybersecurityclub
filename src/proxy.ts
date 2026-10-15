import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every page: security headers with a per-request Content
 * Security Policy nonce. Next.js reads the CSP header during rendering and
 * stamps the nonce on its own scripts, so no inline script runs without it.
 */

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

function applySecurityHeaders(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(response, csp);
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
