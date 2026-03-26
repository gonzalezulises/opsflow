"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, and, asc, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { processSteps, processStepInitiatives, initiatives } from "@/server/db/schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VsmState = "current" | "future";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const processStepSchema = z.object({
  id: z.string().uuid().optional(),
  caseId: z.string().uuid(),
  orderIndex: z.number().int().min(0),
  stepName: z.string().min(1, "El nombre del paso es requerido"),
  department: z.string().optional(),
  processTimeMinutes: z.string().optional(),
  waitTimeHours: z.string().optional(),
  reworkPercentage: z.string().optional(),
  systemUsed: z.string().optional(),
  wip: z.number().int().optional(),
  addsValue: z.boolean().optional(),
  observations: z.string().optional(),
  justification: z.string().optional(),
  linkedInitiativeIds: z.array(z.string().uuid()).optional(),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getProcessSteps(caseId: string, state: VsmState = "current") {
  try {
    const rows = await db
      .select()
      .from(processSteps)
      .where(
        and(
          eq(processSteps.caseId, caseId),
          eq(processSteps.vsmState, state),
        ),
      )
      .orderBy(asc(processSteps.orderIndex));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function hasFutureVSM(caseId: string) {
  try {
    const rows = await db
      .select({ id: processSteps.id })
      .from(processSteps)
      .where(
        and(
          eq(processSteps.caseId, caseId),
          eq(processSteps.vsmState, "future"),
        ),
      )
      .limit(1);

    return { data: rows.length > 0 };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function saveProcessStep(
  data: z.input<typeof processStepSchema>,
) {
  const parsed = processStepSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...values } = parsed.data;

  try {
    let row;
    if (id) {
      [row] = await db
        .update(processSteps)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(processSteps.id, id))
        .returning();
    } else {
      [row] = await db
        .insert(processSteps)
        .values(values)
        .returning();
    }

    revalidatePath(`/cases/${values.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function saveAllProcessSteps(
  caseId: string,
  steps: z.input<typeof processStepSchema>[],
  state: VsmState = "current",
) {
  try {
    const result = await db.transaction(async (tx) => {
      // Delete existing steps for this case AND state only
      await tx
        .delete(processSteps)
        .where(
          and(
            eq(processSteps.caseId, caseId),
            eq(processSteps.vsmState, state),
          ),
        );

      if (steps.length === 0) return [];

      const validatedSteps = steps.map((step, index) => {
        const parsed = processStepSchema.safeParse({
          ...step,
          caseId,
          orderIndex: index,
        });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { id: _id, ...values } = parsed.data;
        return { ...values, vsmState: state as "current" | "future" };
      });

      const rows = await tx
        .insert(processSteps)
        .values(validatedSteps)
        .returning();

      // Dual-write: sync join table from linkedInitiativeIds (best-effort, non-blocking)
      try {
        const allInitIds = new Set<string>();
        for (const row of rows) {
          const ids = (row.linkedInitiativeIds as string[] | null) ?? [];
          for (const id of ids) allInitIds.add(id);
        }

        // Only insert for initiative IDs that actually exist
        let validInitIds = new Set<string>();
        if (allInitIds.size > 0) {
          const existing = await tx
            .select({ id: initiatives.id })
            .from(initiatives)
            .where(
              sql`${initiatives.id} IN (${sql.join(
                Array.from(allInitIds).map((id) => sql`${id}`),
                sql`, `,
              )})`,
            );
          validInitIds = new Set(existing.map((e) => e.id));
        }

        const inserts: { processStepId: string; initiativeId: string }[] = [];
        for (const row of rows) {
          const ids = (row.linkedInitiativeIds as string[] | null) ?? [];
          for (const initId of ids) {
            if (validInitIds.has(initId)) {
              inserts.push({ processStepId: row.id, initiativeId: initId });
            }
          }
        }
        if (inserts.length > 0) {
          await tx.insert(processStepInitiatives).values(inserts);
        }
      } catch {
        // Non-critical: join table sync failure shouldn't block VSM save
      }

      return rows;
    });

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: result };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Clone the current VSM to create a future state.
 * Each future step links to its source via sourceStepId.
 * Returns the new future steps.
 */
export async function cloneCurrentToFuture(caseId: string) {
  try {
    // Check if future already exists
    const existing = await db
      .select({ id: processSteps.id })
      .from(processSteps)
      .where(
        and(
          eq(processSteps.caseId, caseId),
          eq(processSteps.vsmState, "future"),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return { error: "Ya existe un VSM futuro para este caso. Elimínalo primero si quieres recrearlo." };
    }

    const currentSteps = await db
      .select()
      .from(processSteps)
      .where(
        and(
          eq(processSteps.caseId, caseId),
          eq(processSteps.vsmState, "current"),
        ),
      )
      .orderBy(asc(processSteps.orderIndex));

    if (currentSteps.length === 0) {
      return { error: "No hay pasos en el VSM actual. Completa el VSM actual primero." };
    }

    const futureSteps = await db
      .insert(processSteps)
      .values(
        currentSteps.map((s) => ({
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
          sourceStepId: s.id,
        })),
      )
      .returning();

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: futureSteps };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Delete the entire future VSM for a case.
 */
export async function deleteFutureVSM(caseId: string) {
  try {
    await db
      .delete(processSteps)
      .where(
        and(
          eq(processSteps.caseId, caseId),
          eq(processSteps.vsmState, "future"),
        ),
      );

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: { success: true } };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteProcessStep(id: string) {
  try {
    const [row] = await db
      .delete(processSteps)
      .where(eq(processSteps.id, id))
      .returning();

    if (!row) return { error: "Paso no encontrado" };

    revalidatePath(`/dashboard/cases/${row.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function reorderProcessSteps(
  caseId: string,
  orderedIds: string[],
) {
  try {
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(processSteps)
          .set({ orderIndex: i, updatedAt: new Date() })
          .where(eq(processSteps.id, orderedIds[i]));
      }
    });

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: { success: true } };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
