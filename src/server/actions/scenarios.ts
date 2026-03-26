"use server";

import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/server/db";
import { vsmScenarios, processSteps } from "@/server/db/schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getScenarios(caseId: string) {
  try {
    const rows = await db
      .select()
      .from(vsmScenarios)
      .where(eq(vsmScenarios.caseId, caseId))
      .orderBy(asc(vsmScenarios.createdAt));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getScenarioSteps(scenarioId: string) {
  try {
    const rows = await db
      .select()
      .from(processSteps)
      .where(eq(processSteps.scenarioId, scenarioId))
      .orderBy(asc(processSteps.orderIndex));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new scenario by cloning the current VSM (or an existing scenario).
 */
export async function createScenario(
  caseId: string,
  name: string,
  description?: string,
  sourceScenarioId?: string,
) {
  try {
    // Create scenario record
    const [scenario] = await db
      .insert(vsmScenarios)
      .values({ caseId, name, description: description ?? null })
      .returning();

    // Determine source steps: from specific scenario, from future, or from current
    let sourceSteps;
    if (sourceScenarioId) {
      sourceSteps = await db
        .select()
        .from(processSteps)
        .where(eq(processSteps.scenarioId, sourceScenarioId))
        .orderBy(asc(processSteps.orderIndex));
    } else {
      // Try future first, fall back to current
      sourceSteps = await db
        .select()
        .from(processSteps)
        .where(
          and(
            eq(processSteps.caseId, caseId),
            eq(processSteps.vsmState, "future"),
          ),
        )
        .orderBy(asc(processSteps.orderIndex));

      if (sourceSteps.length === 0) {
        sourceSteps = await db
          .select()
          .from(processSteps)
          .where(
            and(
              eq(processSteps.caseId, caseId),
              eq(processSteps.vsmState, "current"),
            ),
          )
          .orderBy(asc(processSteps.orderIndex));
      }
    }

    if (sourceSteps.length === 0) {
      return { error: "No hay pasos de VSM para clonar. Completa el VSM actual primero." };
    }

    // Clone steps into the new scenario
    await db.insert(processSteps).values(
      sourceSteps.map((s) => ({
        caseId,
        orderIndex: s.orderIndex,
        stepName: s.stepName,
        department: s.department,
        processTimeMinutes: s.processTimeMinutes,
        waitTimeHours: s.waitTimeHours,
        reworkPercentage: s.reworkPercentage,
        systemUsed: s.systemUsed,
        wip: s.wip,
        addsValue: s.addsValue,
        observations: s.observations,
        vsmState: "future" as const,
        scenarioId: scenario.id,
        sourceStepId: s.sourceStepId ?? s.id,
        justification: s.justification,
        linkedInitiativeIds: s.linkedInitiativeIds,
      })),
    );

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: scenario };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteScenario(scenarioId: string) {
  try {
    // Delete steps first
    await db.delete(processSteps).where(eq(processSteps.scenarioId, scenarioId));
    // Delete scenario
    const [row] = await db.delete(vsmScenarios).where(eq(vsmScenarios.id, scenarioId)).returning();
    if (!row) return { error: "Escenario no encontrado" };

    revalidatePath(`/dashboard/cases/${row.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function saveScenarioSteps(
  scenarioId: string,
  caseId: string,
  steps: {
    stepName: string;
    department?: string;
    processTimeMinutes?: string;
    waitTimeHours?: string;
    reworkPercentage?: string;
    systemUsed?: string;
    addsValue?: boolean;
    observations?: string;
    justification?: string;
    linkedInitiativeIds?: string[];
  }[],
) {
  try {
    const result = await db.transaction(async (tx) => {
      await tx.delete(processSteps).where(eq(processSteps.scenarioId, scenarioId));

      if (steps.length === 0) return [];

      const rows = await tx
        .insert(processSteps)
        .values(
          steps.map((s, i) => ({
            caseId,
            orderIndex: i,
            stepName: s.stepName,
            department: s.department,
            processTimeMinutes: s.processTimeMinutes,
            waitTimeHours: s.waitTimeHours,
            reworkPercentage: s.reworkPercentage,
            systemUsed: s.systemUsed,
            addsValue: s.addsValue,
            observations: s.observations,
            vsmState: "future" as const,
            scenarioId,
            justification: s.justification,
            linkedInitiativeIds: s.linkedInitiativeIds,
          })),
        )
        .returning();

      return rows;
    });

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: result };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
