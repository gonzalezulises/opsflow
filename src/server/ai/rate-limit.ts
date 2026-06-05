"use server";

import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { aiInteractions, cases } from "@/server/db/schema";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 40;

const ORG_WINDOW_MS = 60 * 60 * 1000;
const MAX_ORG_REQUESTS_PER_WINDOW = 200;

export async function assertAiRateLimit(appUserId: string): Promise<{ error: string } | null> {
  const since = new Date(Date.now() - WINDOW_MS);

  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(aiInteractions)
    .where(
      and(eq(aiInteractions.createdBy, appUserId), gte(aiInteractions.createdAt, since)),
    );

  const count = row?.c ?? 0;
  if (count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      error: `Límite de uso de IA alcanzado (${MAX_REQUESTS_PER_WINDOW} solicitudes por hora). Intenta más tarde.`,
    };
  }

  return null;
}

/** Hourly cap on AI calls aggregated by organization (all cases in org). */
export async function assertOrgAiVolumeLimit(
  organizationId: string,
): Promise<{ error: string } | null> {
  const since = new Date(Date.now() - ORG_WINDOW_MS);

  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(aiInteractions)
    .innerJoin(cases, eq(cases.id, aiInteractions.caseId))
    .where(
      and(eq(cases.organizationId, organizationId), gte(aiInteractions.createdAt, since)),
    );

  const count = row?.c ?? 0;
  if (count >= MAX_ORG_REQUESTS_PER_WINDOW) {
    return {
      error: `La organización alcanzó el límite de uso de IA (${MAX_ORG_REQUESTS_PER_WINDOW} solicitudes por hora). Intenta más tarde.`,
    };
  }

  return null;
}

export async function recordAiInteraction(params: {
  appUserId: string;
  caseId: string;
  module: string;
  actionType: string;
  modelUsed: string | null;
  tokensUsed: number;
}): Promise<void> {
  try {
    await db.insert(aiInteractions).values({
      caseId: params.caseId,
      module: params.module,
      actionType: params.actionType,
      modelUsed: params.modelUsed,
      tokensUsed: params.tokensUsed,
      createdBy: params.appUserId,
      updatedBy: params.appUserId,
    });
  } catch {
    // non-blocking
  }
}
