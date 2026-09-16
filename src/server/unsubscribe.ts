import "server-only";
import { absoluteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { signUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/tokens";
import { appSecret } from "@/server/env";

export function unsubscribeLinks(userId: string) {
  const token = signUnsubscribeToken(appSecret(), userId);
  return {
    page: absoluteUrl(`/unsubscribe?token=${encodeURIComponent(token)}`),
    oneClick: absoluteUrl(`/api/email/unsubscribe?token=${encodeURIComponent(token)}`),
  };
}

/** Headers that let mail clients offer one-click unsubscribe (RFC 8058). */
export function unsubscribeHeaders(userId: string) {
  const { oneClick } = unsubscribeLinks(userId);
  return {
    "List-Unsubscribe": `<${oneClick}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

/** Turns event emails off for the member the signed token belongs to. */
export async function unsubscribeFromEventEmails(token: unknown) {
  const userId = verifyUnsubscribeToken(appSecret(), token);
  if (!userId) return false;
  const { error } = await createAdminClient().from("profiles").update({ notify_events: false }).eq("id", userId);
  if (error) throw error;
  return true;
}
