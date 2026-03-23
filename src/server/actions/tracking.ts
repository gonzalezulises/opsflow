"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { db } from "@/server/db";
import { weeklyMetrics } from "@/server/db/schema";

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

    revalidatePath(`/cases/${values.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteWeeklyMetric(id: string) {
  try {
    const [row] = await db
      .delete(weeklyMetrics)
      .where(eq(weeklyMetrics.id, id))
      .returning();

    if (!row) return { error: "Métrica no encontrada" };

    revalidatePath(`/cases/${row.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
