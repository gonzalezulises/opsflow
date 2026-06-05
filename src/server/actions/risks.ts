"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { riskItems } from "@/server/db/schema";
import { calculateExposure } from "@/lib/calculations";
import {
  requireCaseInOrganization,
  requireWritableCase,
} from "@/server/auth/guards";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const riskItemSchema = z.object({
  id: z.string().uuid().optional(),
  caseId: z.string().uuid(),
  processStepId: z.string().uuid().nullable().optional(),
  riskDescription: z.string().min(1, "La descripción del riesgo es requerida"),
  riskType: z.string().optional(),
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  earlySignals: z.string().optional(),
  mitigations: z.string().optional(),
  additionalAction: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getRiskItems(caseId: string) {
  try {
    const gate = await requireCaseInOrganization(caseId);
    if ("error" in gate) return { error: gate.error };

    const rows = await db
      .select()
      .from(riskItems)
      .where(eq(riskItems.caseId, caseId));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function saveRiskItem(data: z.input<typeof riskItemSchema>) {
  const parsed = riskItemSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...values } = parsed.data;
  const exposure = String(calculateExposure(values.probability, values.impact));

  const writeGate = await requireWritableCase(values.caseId);
  if ("error" in writeGate) return { error: writeGate.error };

  try {
    let row;
    if (id) {
      [row] = await db
        .update(riskItems)
        .set({ ...values, exposure, updatedAt: new Date() })
        .where(eq(riskItems.id, id))
        .returning();
    } else {
      [row] = await db
        .insert(riskItems)
        .values({ ...values, exposure })
        .returning();
    }

    revalidatePath(`/dashboard/cases/${values.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteRiskItem(id: string) {
  try {
    const [existing] = await db
      .select({ caseId: riskItems.caseId })
      .from(riskItems)
      .where(eq(riskItems.id, id));

    if (!existing) return { error: "Riesgo no encontrado" };

    const writeGate = await requireWritableCase(existing.caseId);
    if ("error" in writeGate) return { error: writeGate.error };

    const [row] = await db
      .delete(riskItems)
      .where(eq(riskItems.id, id))
      .returning();

    if (!row) return { error: "Riesgo no encontrado" };

    revalidatePath(`/dashboard/cases/${row.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function saveAllRiskItems(
  caseId: string,
  items: z.input<typeof riskItemSchema>[],
) {
  const writeGate = await requireWritableCase(caseId);
  if ("error" in writeGate) return { error: writeGate.error };

  try {
    const result = await db.transaction(async (tx) => {
      await tx.delete(riskItems).where(eq(riskItems.caseId, caseId));

      if (items.length === 0) return [];

      const validatedItems = items.map((item) => {
        const parsed = riskItemSchema.safeParse({ ...item, caseId });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { id: _id, ...values } = parsed.data;
        const exposure = String(
          calculateExposure(values.probability, values.impact),
        );
        return { ...values, exposure };
      });

      const rows = await tx
        .insert(riskItems)
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
