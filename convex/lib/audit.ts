import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function writeAudit(
  ctx: MutationCtx,
  actorId: Id<"users">,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata?: string,
) {
  await ctx.db.insert("auditLogs", {
    actorId,
    action,
    resourceType,
    resourceId,
    ...(metadata ? { metadata } : {}),
    createdAt: Date.now(),
  });
}
