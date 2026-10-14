import "server-only";
import { createSupabaseServiceClient } from "@/server/supabase/service";

/**
 * Audit entries for actions that do not change a table row (sign-ins, MFA,
 * invitations). Table changes are audited by database triggers. Written
 * through a service-only RPC so officers cannot forge or edit entries.
 */
export async function logAction(
  action: string,
  opts: { actorId?: string | null; actorEmail?: string | null; eventId?: string | null; targetUserId?: string | null; details?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    const service = createSupabaseServiceClient();
    // The generated types mark every argument as required; the SQL function accepts nulls.
    const args = {
      p_action: action,
      p_actor_id: opts.actorId ?? null,
      p_actor_email: opts.actorEmail ?? null,
      p_event_id: opts.eventId ?? null,
      p_target_user_id: opts.targetUserId ?? null,
      p_details: opts.details ?? {},
    } as unknown as Parameters<typeof service.rpc<"log_action">>[1];
    const { error } = await service.rpc("log_action", args);
    if (error) console.error("[audit] could not record", action, error.message);
  } catch (err) {
    console.error("[audit] could not record", action, (err as Error).message);
  }
}
