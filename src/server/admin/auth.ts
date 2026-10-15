import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readAdminConfig } from "./password";
import { createSession, passwordTag, SESSION_COOKIE, SESSION_TTL_MS, verifySession } from "./session";

/** True when the request carries a valid admin session cookie. */
export async function hasAdminSession(): Promise<boolean> {
  const config = readAdminConfig();
  if (!config.ok) return false;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token, { secret: config.secret, passwordTag: passwordTag(config.password) }).ok;
}

/** Pages and actions call this first. Signed-out visitors land on the login page. */
export async function requireAdmin(): Promise<void> {
  if (!(await hasAdminSession())) redirect("/admin/login");
}

export async function startAdminSession(): Promise<void> {
  const config = readAdminConfig();
  if (!config.ok) throw new Error("The admin page is not configured");
  (await cookies()).set({
    name: SESSION_COOKIE,
    value: createSession({ secret: config.secret, passwordTag: passwordTag(config.password) }),
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "lax",
    path: "/admin",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).set({ name: SESSION_COOKIE, value: "", path: "/admin", maxAge: 0 });
}

/** A stable, non-reversible key for one session, used to rate limit saves. */
export async function sessionKey(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}
