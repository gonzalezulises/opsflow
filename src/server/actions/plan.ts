"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { actionItems } from "@/server/db/schema";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const actionItemSchema = z.object({
  id: z.string().uuid().optional(),
  caseId: z.string().uuid(),
  initiativeId: z.string().uuid().nullable().optional(),
  actionDescription: z.string().min(1, "La descripción de la acción es requerida"),
  responsible: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  leadMetric: z.string().optional(),
  baselineValue: z.string().optional(),
  targetValue: z.string().optional(),
  contingency: z.string().optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "blocked", "cancelled"])
    .optional(),
});

const statusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "blocked",
  "cancelled",
]);

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getActionItems(caseId: string) {
  try {
    const rows = await db
      .select()
      .from(actionItems)
      .where(eq(actionItems.caseId, caseId));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function saveActionItem(
  data: z.input<typeof actionItemSchema>,
) {
  const parsed = actionItemSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...values } = parsed.data;

  try {
    let row;
    if (id) {
      [row] = await db
        .update(actionItems)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(actionItems.id, id))
        .returning();
    } else {
      [row] = await db
        .insert(actionItems)
        .values(values)
        .returning();
    }

    revalidatePath(`/cases/${values.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteActionItem(id: string) {
  try {
    const [row] = await db
      .delete(actionItems)
      .where(eq(actionItems.id, id))
      .returning();

    if (!row) return { error: "Acción no encontrada" };

    revalidatePath(`/cases/${row.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function updateActionItemStatus(
  id: string,
  status: z.input<typeof statusSchema>,
) {
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const [row] = await db
      .update(actionItems)
      .set({ status: parsed.data, updatedAt: new Date() })
      .where(eq(actionItems.id, id))
      .returning();

    if (!row) return { error: "Acción no encontrada" };

    revalidatePath(`/cases/${row.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
