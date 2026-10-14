import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Session cookie attributes, shared by the request-bound server client and
 * the proxy so every write uses the same scope.
 *
 * All Supabase calls happen on the server, so the browser never needs to read
 * the session: HttpOnly keeps it away from scripts. SameSite=Lax plus the
 * Server Action origin check covers CSRF. Secure is on outside development so
 * local http://localhost still works.
 */
export function sessionCookieOptions(): CookieOptionsWithName {
  return {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
}
