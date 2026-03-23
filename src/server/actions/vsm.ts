"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "@/server/db";
import { processSteps } from "@/server/db/schema";

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
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getProcessSteps(caseId: string) {
  try {
    const rows = await db
      .select()
      .from(processSteps)
      .where(eq(processSteps.caseId, caseId))
      .orderBy(asc(processSteps.orderIndex));

    return { data: rows };
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
) {
  try {
    const result = await db.transaction(async (tx) => {
      // Delete existing steps for this case
      await tx
        .delete(processSteps)
        .where(eq(processSteps.caseId, caseId));

      if (steps.length === 0) return [];

      // Validate and insert all new steps
      const validatedSteps = steps.map((step, index) => {
        const parsed = processStepSchema.safeParse({
          ...step,
          caseId,
          orderIndex: index,
        });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { id: _id, ...values } = parsed.data;
        return values;
      });

      const rows = await tx
        .insert(processSteps)
        .values(validatedSteps)
        .returning();

      return rows;
    });

    revalidatePath(`/cases/${caseId}`);
    return { data: result };
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

    revalidatePath(`/cases/${row.caseId}`);
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

    revalidatePath(`/cases/${caseId}`);
    return { data: { success: true } };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
