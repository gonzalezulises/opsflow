"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/server/db";
import {
  diagnosticQuestions,
  diagnosticResponses,
} from "@/server/db/schema";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const saveResponseSchema = z.object({
  caseId: z.string().uuid(),
  questionId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

const bulkResponseSchema = z.object({
  caseId: z.string().uuid(),
  responses: z.array(
    z.object({
      questionId: z.string().uuid(),
      score: z.number().int().min(1).max(5),
      comment: z.string().optional(),
    }),
  ),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getDiagnosticQuestions(caseId: string) {
  try {
    const rows = await db
      .select()
      .from(diagnosticQuestions)
      .where(eq(diagnosticQuestions.caseId, caseId))
      .orderBy(asc(diagnosticQuestions.orderIndex));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getDiagnosticResponses(caseId: string) {
  try {
    const rows = await db
      .select()
      .from(diagnosticResponses)
      .where(eq(diagnosticResponses.caseId, caseId));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function saveDiagnosticResponse(
  data: z.input<typeof saveResponseSchema>,
) {
  const parsed = saveResponseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { caseId, questionId, score, comment } = parsed.data;

  try {
    const existing = await db
      .select()
      .from(diagnosticResponses)
      .where(
        and(
          eq(diagnosticResponses.caseId, caseId),
          eq(diagnosticResponses.questionId, questionId),
        ),
      );

    let row;
    if (existing.length > 0) {
      [row] = await db
        .update(diagnosticResponses)
        .set({ score, comment, updatedAt: new Date() })
        .where(eq(diagnosticResponses.id, existing[0].id))
        .returning();
    } else {
      [row] = await db
        .insert(diagnosticResponses)
        .values({ caseId, questionId, score, comment })
        .returning();
    }

    revalidatePath(`/cases/${caseId}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function saveBulkDiagnosticResponses(
  data: z.input<typeof bulkResponseSchema>,
) {
  const parsed = bulkResponseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { caseId, responses } = parsed.data;

  try {
    const results = await db.transaction(async (tx) => {
      const saved = [];

      for (const resp of responses) {
        const existing = await tx
          .select()
          .from(diagnosticResponses)
          .where(
            and(
              eq(diagnosticResponses.caseId, caseId),
              eq(diagnosticResponses.questionId, resp.questionId),
            ),
          );

        if (existing.length > 0) {
          const [row] = await tx
            .update(diagnosticResponses)
            .set({
              score: resp.score,
              comment: resp.comment,
              updatedAt: new Date(),
            })
            .where(eq(diagnosticResponses.id, existing[0].id))
            .returning();
          saved.push(row);
        } else {
          const [row] = await tx
            .insert(diagnosticResponses)
            .values({
              caseId,
              questionId: resp.questionId,
              score: resp.score,
              comment: resp.comment,
            })
            .returning();
          saved.push(row);
        }
      }

      return saved;
    });

    revalidatePath(`/cases/${caseId}`);
    return { data: results };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
