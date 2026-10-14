import "server-only";
import { forbidden, redirect } from "next/navigation";
import { createSupabaseServerClient, type SupabaseServerClient } from "@/server/supabase/server";

export type AdminRole = "owner" | "editor";
export type Aal = "aal1" | "aal2";

/** Everything an admin page or action needs about the signed-in officer. */
export type AdminContext = {
  supabase: SupabaseServerClient;
  userId: string;
  email: string;
  displayName: string | null;
  role: AdminRole;
};

export type SessionState =
  | { kind: "anonymous" }
  /** Signed in, but not in admin_users. */
  | { kind: "not-admin"; userId: string; email: string }
  /** In admin_users with revoked_at set. */
  | { kind: "revoked"; userId: string; email: string }
  /** An officer whose session has not passed a second factor yet. */
  | { kind: "needs-mfa"; userId: string; email: string; supabase: SupabaseServerClient }
  | { kind: "admin"; ctx: AdminContext };

/**
 * Verifies the session and looks up the live admin row. Called by every admin
 * page and Server Action. Nothing here trusts the cookie's user object: the
 * JWT is verified by getClaims and the role comes from the database.
 */
export async function getSessionState(): Promise<SessionState> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || typeof claims.sub !== "string") return { kind: "anonymous" };
  const userId = claims.sub;
  const email = typeof claims.email === "string" ? claims.email : "";
  const aal: Aal = claims.aal === "aal2" ? "aal2" : "aal1";

  const { data: row, error: rowError } = await supabase
    .from("admin_users")
    .select("user_id, email, display_name, role, revoked_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (rowError) {
    console.error("[auth] admin lookup failed:", rowError.message);
    return { kind: "not-admin", userId, email };
  }
  if (!row) return { kind: "not-admin", userId, email };
  if (row.revoked_at) return { kind: "revoked", userId, email: row.email };
  if (aal !== "aal2") return { kind: "needs-mfa", userId, email: row.email, supabase };
  return { kind: "admin", ctx: { supabase, userId, email: row.email, displayName: row.display_name, role: row.role } };
}

/**
 * For pages. Redirects anyone who is not an active, MFA-verified officer and
 * renders the 403 page for editors on owner-only pages.
 */
export async function requireAdmin(opts: { owner?: boolean } = {}): Promise<AdminContext> {
  const state = await getSessionState();
  switch (state.kind) {
    case "anonymous":
      redirect("/admin/login");
    case "not-admin":
      redirect("/admin/login?reason=not-admin");
    case "revoked":
      redirect("/admin/login?reason=revoked");
    case "needs-mfa":
      redirect("/admin/mfa");
    case "admin":
      if (opts.owner && state.ctx.role !== "owner") forbidden();
      return state.ctx;
  }
}

export type AuthFailure = "unauthenticated" | "mfa_required" | "revoked" | "forbidden";

export class ActionAuthError extends Error {
  constructor(public readonly code: AuthFailure) {
    super(code);
    this.name = "ActionAuthError";
  }
}

export const AUTH_FAILURE_MESSAGES: Record<AuthFailure, string> = {
  unauthenticated: "Your session has ended. Sign in again.",
  mfa_required: "Confirm your authenticator code before making changes.",
  revoked: "Your administrator access has been revoked.",
  forbidden: "Only the owner can do that.",
};

/** For Server Actions: same checks as requireAdmin, but throws instead of redirecting. */
export async function requireAdminAction(opts: { owner?: boolean } = {}): Promise<AdminContext> {
  const state = await getSessionState();
  switch (state.kind) {
    case "anonymous":
    case "not-admin":
      throw new ActionAuthError("unauthenticated");
    case "revoked":
      throw new ActionAuthError("revoked");
    case "needs-mfa":
      throw new ActionAuthError("mfa_required");
    case "admin":
      if (opts.owner && state.ctx.role !== "owner") throw new ActionAuthError("forbidden");
      return state.ctx;
  }
}
