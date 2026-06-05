"use server";

import { db } from "@/server/db";
import { auditEvents } from "@/server/db/schema";
import type { OrganizationContext } from "./types";

type AuditPayload = {
  ctx: OrganizationContext;
  caseId?: string | null;
  eventType: string;
  entityType: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
};

/**
 * Best-effort audit log. Failures are swallowed so business operations still succeed.
 */
export async function logAuditEvent(payload: AuditPayload): Promise<void> {
  try {
    await db.insert(auditEvents).values({
      organizationId: payload.ctx.organizationId,
      caseId: payload.caseId ?? null,
      userId: payload.ctx.appUserId,
      eventType: payload.eventType,
      entityType: payload.entityType,
      entityId: payload.entityId,
      oldData: payload.oldData as Record<string, unknown> | undefined,
      newData: payload.newData as Record<string, unknown> | undefined,
    });
  } catch {
    // non-blocking
  }
}
