import "server-only";
import { prisma } from "@/server/db";

export type AuditActor = { id: string; email: string } | null;

/**
 * Records a meaningful administrative or account change. Never throws: an
 * audit failure should not break the action itself, but it is logged.
 */
export async function audit(
  actor: AuditActor,
  action: string,
  target: { type: string; id?: string | null },
  summary: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorEmail: actor?.email ?? null,
        action,
        targetType: target.type,
        targetId: target.id ?? null,
        summary,
        metadataJson: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record", action, err);
  }
}
