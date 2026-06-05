"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { initiatives, prioritizationWeights, processStepInitiatives } from "@/server/db/schema";
import {
  requireCaseInOrganization,
  requireWritableCase,
} from "@/server/auth/guards";
import {
  calculatePrioritizationScore,
  DEFAULT_WEIGHTS,
  type PrioritizationWeights,
} from "@/lib/calculations";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const initiativeSchema = z.object({
  id: z.string().uuid().optional(),
  caseId: z.string().uuid(),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  impactLeadTime: z.number().min(1).max(5),
  impactEconomic: z.number().min(1).max(5),
  impactResilience: z.number().min(1).max(5),
  feasibility30d: z.number().min(1).max(5),
  effort: z.number().min(1).max(5),
  externalDependency: z.number().min(1).max(5),
});

const weightsSchema = z.object({
  impactLeadTime: z.number().min(0).max(1),
  impactEconomic: z.number().min(0).max(1),
  impactResilience: z.number().min(0).max(1),
  feasibility30d: z.number().min(0).max(1),
  effort: z.number().min(0).max(1),
  externalDependency: z.number().min(0).max(1),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getWeightsForCase(caseId: string): Promise<PrioritizationWeights> {
  const rows = await db
    .select()
    .from(prioritizationWeights)
    .where(eq(prioritizationWeights.caseId, caseId));

  if (rows.length === 0) return DEFAULT_WEIGHTS;

  const w = rows[0];
  return {
    impactLeadTime: Number(w.impactLeadTime),
    impactEconomic: Number(w.impactEconomic),
    impactResilience: Number(w.impactResilience),
    feasibility30d: Number(w.feasibility30d),
    effort: Number(w.effort),
    externalDependency: Number(w.externalDependency),
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getInitiatives(caseId: string) {
  try {
    const gate = await requireCaseInOrganization(caseId);
    if ("error" in gate) return { error: gate.error };

    const rows = await db
      .select()
      .from(initiatives)
      .where(eq(initiatives.caseId, caseId));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getPrioritizationWeights(caseId: string) {
  try {
    const gate = await requireCaseInOrganization(caseId);
    if ("error" in gate) return { error: gate.error };

    const weights = await getWeightsForCase(caseId);
    return { data: weights };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function saveInitiative(
  data: z.input<typeof initiativeSchema>,
) {
  const parsed = initiativeSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, caseId, name, description, ...scores } = parsed.data;
  const weights = await getWeightsForCase(caseId);

  const writeGate = await requireWritableCase(caseId);
  if ("error" in writeGate) return { error: writeGate.error };

  const { totalScore, classification } = calculatePrioritizationScore(
    scores,
    weights,
  );

  const values = {
    caseId,
    name,
    description,
    impactLeadTime: String(scores.impactLeadTime),
    impactEconomic: String(scores.impactEconomic),
    impactResilience: String(scores.impactResilience),
    feasibility30d: String(scores.feasibility30d),
    effort: String(scores.effort),
    externalDependency: String(scores.externalDependency),
    totalScore: String(totalScore),
    classification,
  };

  try {
    let row;
    if (id) {
      [row] = await db
        .update(initiatives)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(initiatives.id, id))
        .returning();
    } else {
      [row] = await db
        .insert(initiatives)
        .values(values)
        .returning();
    }

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteInitiative(id: string) {
  try {
    const [existing] = await db
      .select({ caseId: initiatives.caseId })
      .from(initiatives)
      .where(eq(initiatives.id, id));

    if (!existing) return { error: "Iniciativa no encontrada" };

    const writeGate = await requireWritableCase(existing.caseId);
    if ("error" in writeGate) return { error: writeGate.error };

    const [row] = await db
      .delete(initiatives)
      .where(eq(initiatives.id, id))
      .returning();

    if (!row) return { error: "Iniciativa no encontrada" };

    revalidatePath(`/dashboard/cases/${row.caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function savePrioritizationWeights(
  caseId: string,
  data: z.input<typeof weightsSchema>,
) {
  const parsed = weightsSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const values = {
    impactLeadTime: String(parsed.data.impactLeadTime),
    impactEconomic: String(parsed.data.impactEconomic),
    impactResilience: String(parsed.data.impactResilience),
    feasibility30d: String(parsed.data.feasibility30d),
    effort: String(parsed.data.effort),
    externalDependency: String(parsed.data.externalDependency),
  };

  const writeGate = await requireWritableCase(caseId);
  if ("error" in writeGate) return { error: writeGate.error };

  try {
    const existing = await db
      .select()
      .from(prioritizationWeights)
      .where(eq(prioritizationWeights.caseId, caseId));

    let row;
    if (existing.length > 0) {
      [row] = await db
        .update(prioritizationWeights)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(prioritizationWeights.id, existing[0].id))
        .returning();
    } else {
      [row] = await db
        .insert(prioritizationWeights)
        .values({ caseId, ...values })
        .returning();
    }

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function saveAllInitiatives(
  caseId: string,
  items: z.input<typeof initiativeSchema>[],
) {
  const writeGate = await requireWritableCase(caseId);
  if ("error" in writeGate) return { error: writeGate.error };

  try {
    const weights = await getWeightsForCase(caseId);

    const result = await db.transaction(async (tx) => {
      // Delete join table records for initiatives being replaced
      const existingInits = await tx
        .select({ id: initiatives.id })
        .from(initiatives)
        .where(eq(initiatives.caseId, caseId));

      if (existingInits.length > 0) {
        const ids = existingInits.map((i) => i.id);
        await tx
          .delete(processStepInitiatives)
          .where(inArray(processStepInitiatives.initiativeId, ids));
      }

      await tx.delete(initiatives).where(eq(initiatives.caseId, caseId));

      if (items.length === 0) return [];

      const validatedItems = items.map((item) => {
        const parsed = initiativeSchema.safeParse({ ...item, caseId });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);

        const { id, caseId: _caseId, name, description, ...scores } = parsed.data;
        const { totalScore, classification } = calculatePrioritizationScore(scores, weights);

        return {
          caseId,
          name,
          description,
          impactLeadTime: String(scores.impactLeadTime),
          impactEconomic: String(scores.impactEconomic),
          impactResilience: String(scores.impactResilience),
          feasibility30d: String(scores.feasibility30d),
          effort: String(scores.effort),
          externalDependency: String(scores.externalDependency),
          totalScore: String(totalScore),
          classification,
        };
      });

      const rows = await tx
        .insert(initiatives)
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

export async function recalculateAllScores(caseId: string) {
  const writeGate = await requireWritableCase(caseId);
  if ("error" in writeGate) return { error: writeGate.error };

  try {
    const weights = await getWeightsForCase(caseId);

    const rows = await db
      .select()
      .from(initiatives)
      .where(eq(initiatives.caseId, caseId));

    const updated = await db.transaction(async (tx) => {
      const results = [];

      for (const row of rows) {
        const scores = {
          impactLeadTime: Number(row.impactLeadTime),
          impactEconomic: Number(row.impactEconomic),
          impactResilience: Number(row.impactResilience),
          feasibility30d: Number(row.feasibility30d),
          effort: Number(row.effort),
          externalDependency: Number(row.externalDependency),
        };

        const { totalScore, classification } =
          calculatePrioritizationScore(scores, weights);

        const [updatedRow] = await tx
          .update(initiatives)
          .set({
            totalScore: String(totalScore),
            classification,
            updatedAt: new Date(),
          })
          .where(eq(initiatives.id, row.id))
          .returning();

        results.push(updatedRow);
      }

      return results;
    });

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: updated };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
