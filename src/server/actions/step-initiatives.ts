"use server";

import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { processStepInitiatives, processSteps, initiatives } from "@/server/db/schema";
import {
  assertProcessStepInOrganization,
  assertInitiativeInOrganization,
  requireWritableCase,
} from "@/server/auth/guards";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Get all initiative IDs linked to a specific process step.
 */
export async function getInitiativesByStep(stepId: string) {
  try {
    const gate = await assertProcessStepInOrganization(stepId);
    if ("error" in gate) return { error: gate.error };

    const rows = await db
      .select({
        initiativeId: processStepInitiatives.initiativeId,
        initiativeName: initiatives.name,
        classification: initiatives.classification,
      })
      .from(processStepInitiatives)
      .innerJoin(initiatives, eq(processStepInitiatives.initiativeId, initiatives.id))
      .where(eq(processStepInitiatives.processStepId, stepId));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Get all process steps linked to a specific initiative.
 */
export async function getStepsByInitiative(initiativeId: string) {
  try {
    const gate = await assertInitiativeInOrganization(initiativeId);
    if ("error" in gate) return { error: gate.error };

    const rows = await db
      .select({
        processStepId: processStepInitiatives.processStepId,
        stepName: processSteps.stepName,
        department: processSteps.department,
        vsmState: processSteps.vsmState,
      })
      .from(processStepInitiatives)
      .innerJoin(processSteps, eq(processStepInitiatives.processStepId, processSteps.id))
      .where(eq(processStepInitiatives.initiativeId, initiativeId));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Sync helper (dual-write: jsonb → join table)
// ---------------------------------------------------------------------------

/**
 * Sync the join table from the jsonb field for a set of steps.
 * Called after saveAllProcessSteps to keep both in sync.
 */
export async function syncStepInitiatives(
  stepIds: string[],
  stepInitiativeMap: Map<string, string[]>,
) {
  if (stepIds.length === 0) {
    return { data: { synced: 0 } };
  }

  try {
    const gate = await assertProcessStepInOrganization(stepIds[0]!);
    if ("error" in gate) return { error: gate.error };

    const writeGate = await requireWritableCase(gate.caseId);
    if ("error" in writeGate) return { error: writeGate.error };

    await db.transaction(async (tx) => {
      // Delete existing links for these steps
      for (const stepId of stepIds) {
        await tx
          .delete(processStepInitiatives)
          .where(eq(processStepInitiatives.processStepId, stepId));
      }

      // Insert new links
      const inserts: { processStepId: string; initiativeId: string }[] = [];
      for (const [stepId, initIds] of stepInitiativeMap) {
        for (const initId of initIds) {
          inserts.push({ processStepId: stepId, initiativeId: initId });
        }
      }

      if (inserts.length > 0) {
        await tx.insert(processStepInitiatives).values(inserts);
      }
    });

    return { data: { synced: stepIds.length } };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
