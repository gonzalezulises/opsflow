"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { wasteItems } from "@/server/db/schema";
import { calculateWasteCost } from "@/lib/calculations";
import {
  requireCaseInOrganization,
  requireWritableCase,
} from "@/server/auth/guards";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const wasteItemSchema = z.object({
  id: z.string().uuid().optional(),
  caseId: z.string().uuid(),
  problemDescription: z.string().min(1, "La descripción del problema es requerida"),
  frequencyPerWeek: z.number().min(0).optional(),
  minutesLostPerEvent: z.number().min(0).optional(),
  hourlyLaborCost: z.number().min(0).optional(),
  unitsAffected: z.number().min(0).optional(),
  unitMargin: z.number().min(0).optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeCosts(data: z.output<typeof wasteItemSchema>) {
  const costs = calculateWasteCost({
    frequencyPerWeek: data.frequencyPerWeek ?? 0,
    minutesLostPerEvent: data.minutesLostPerEvent ?? 0,
    hourlyLaborCost: data.hourlyLaborCost ?? 0,
    unitsAffected: data.unitsAffected,
    unitMargin: data.unitMargin,
  });

  return {
    frequencyPerWeek: data.frequencyPerWeek != null ? String(data.frequencyPerWeek) : null,
    minutesLostPerEvent: data.minutesLostPerEvent != null ? String(data.minutesLostPerEvent) : null,
    hourlyLaborCost: data.hourlyLaborCost != null ? String(data.hourlyLaborCost) : null,
    unitsAffected: data.unitsAffected != null ? String(data.unitsAffected) : null,
    unitMargin: data.unitMargin != null ? String(data.unitMargin) : null,
    laborCostMonthly: String(costs.laborCostMonthly),
    marginLostMonthly: String(costs.marginLostMonthly),
    totalCostMonthly: String(costs.totalCostMonthly),
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getWasteItems(caseId: string) {
  try {
    const gate = await requireCaseInOrganization(caseId);
    if ("error" in gate) return { error: gate.error };

    const rows = await db
      .select()
      .from(wasteItems)
      .where(eq(wasteItems.caseId, caseId));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function saveWasteItem(data: z.input<typeof wasteItemSchema>) {
  const parsed = wasteItemSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, caseId, problemDescription } = parsed.data;
  const computed = computeCosts(parsed.data);

  const writeGate = await requireWritableCase(caseId);
  if ("error" in writeGate) return { error: writeGate.error };

  try {
    let row;
    if (id) {
      [row] = await db
        .update(wasteItems)
        .set({
          problemDescription,
          ...computed,
          updatedAt: new Date(),
        })
        .where(eq(wasteItems.id, id))
        .returning();
    } else {
      [row] = await db
        .insert(wasteItems)
        .values({
          caseId,
          problemDescription,
          ...computed,
        })
        .returning();
    }

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteWasteItem(id: string) {
  try {
    const [existing] = await db
      .select({ caseId: wasteItems.caseId })
      .from(wasteItems)
      .where(eq(wasteItems.id, id));

    if (!existing) return { error: "Desperdicio no encontrado" };

    const writeGate = await requireWritableCase(existing.caseId);
    if ("error" in writeGate) return { error: writeGate.error };

    const [row] = await db
      .delete(wasteItems)
      .where(eq(wasteItems.id, id))
      .returning();

    if (!row) return { error: "Desperdicio no encontrado" };

    revalidatePath(`/dashboard/cases/${row.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function saveAllWasteItems(
  caseId: string,
  items: z.input<typeof wasteItemSchema>[],
) {
  const writeGate = await requireWritableCase(caseId);
  if ("error" in writeGate) return { error: writeGate.error };

  try {
    const result = await db.transaction(async (tx) => {
      await tx.delete(wasteItems).where(eq(wasteItems.caseId, caseId));

      if (items.length === 0) return [];

      const validatedItems = items.map((item) => {
        const parsed = wasteItemSchema.safeParse({ ...item, caseId });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const computed = computeCosts(parsed.data);
        return {
          caseId,
          problemDescription: parsed.data.problemDescription,
          ...computed,
        };
      });

      const rows = await tx
        .insert(wasteItems)
        .values(validatedItems)
        .returning();

      return rows;
    });

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: result };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
