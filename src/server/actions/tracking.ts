"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "@/server/db";
import { weeklyMetrics } from "@/server/db/schema";
import {
  requireCaseInOrganization,
  requireWritableCase,
} from "@/server/auth/guards";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const weeklyMetricSchema = z.object({
  id: z.string().uuid().optional(),
  caseId: z.string().uuid(),
  weekNumber: z.number().int().min(1),
  weekStartDate: z.string().optional(),
  leadTime: z.string().optional(),
  otdOtif: z.string().optional(),
  pctOrdersCorrected: z.string().optional(),
  pctOrdersRescheduled: z.string().optional(),
  reworkPicking: z.string().optional(),
  planProgress: z.string().optional(),
  notes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getWeeklyMetrics(caseId: string) {
  try {
    const gate = await requireCaseInOrganization(caseId);
    if ("error" in gate) return { error: gate.error };

    const rows = await db
      .select()
      .from(weeklyMetrics)
      .where(eq(weeklyMetrics.caseId, caseId))
      .orderBy(asc(weeklyMetrics.weekNumber));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function saveWeeklyMetric(
  data: z.input<typeof weeklyMetricSchema>,
) {
  const parsed = weeklyMetricSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...values } = parsed.data;

  const writeGate = await requireWritableCase(values.caseId);
  if ("error" in writeGate) return { error: writeGate.error };

  try {
    let row;
    if (id) {
      [row] = await db
        .update(weeklyMetrics)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(weeklyMetrics.id, id))
        .returning();
    } else {
      [row] = await db
        .insert(weeklyMetrics)
        .values(values)
        .returning();
    }

    revalidatePath(`/dashboard/cases/${values.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function saveAllWeeklyMetrics(
  caseId: string,
  items: z.input<typeof weeklyMetricSchema>[],
) {
  const writeGate = await requireWritableCase(caseId);
  if ("error" in writeGate) return { error: writeGate.error };

  try {
    const result = await db.transaction(async (tx) => {
      await tx.delete(weeklyMetrics).where(eq(weeklyMetrics.caseId, caseId));

      if (items.length === 0) return [];

      const validatedItems = items.map((item) => {
        const parsed = weeklyMetricSchema.safeParse({ ...item, caseId });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        const { id, ...values } = parsed.data;
        return values;
      });

      const rows = await tx
        .insert(weeklyMetrics)
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

export async function deleteWeeklyMetric(id: string) {
  try {
    const [existing] = await db
      .select({ caseId: weeklyMetrics.caseId })
      .from(weeklyMetrics)
      .where(eq(weeklyMetrics.id, id));

    if (!existing) return { error: "Métrica no encontrada" };

    const writeGate = await requireWritableCase(existing.caseId);
    if ("error" in writeGate) return { error: writeGate.error };

    const [row] = await db
      .delete(weeklyMetrics)
      .where(eq(weeklyMetrics.id, id))
      .returning();

    if (!row) return { error: "Métrica no encontrada" };

    revalidatePath(`/dashboard/cases/${row.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
