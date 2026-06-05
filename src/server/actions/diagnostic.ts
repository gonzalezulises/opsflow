"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/server/db";
import {
  diagnosticQuestions,
  diagnosticResponses,
} from "@/server/db/schema";
import {
  requireCaseInOrganization,
  requireWritableCase,
} from "@/server/auth/guards";
import { isReadOnlyRole } from "@/server/auth/roles";

// ---------------------------------------------------------------------------
// Default diagnostic questions (auto-created if case has none)
// ---------------------------------------------------------------------------

const DEFAULT_QUESTIONS: { category: string; questionText: string }[] = [
  { category: "Planificación", questionText: "¿Existe un flujo documentado y actualizado del proceso foco?" },
  { category: "Planificación", questionText: "¿Los roles y responsabilidades de cada etapa están claramente definidos?" },
  { category: "Planificación", questionText: "¿Se han establecido métricas de desempeño para el proceso?" },
  { category: "Ejecución", questionText: "¿Se cumplen los estándares operativos definidos para cada etapa?" },
  { category: "Ejecución", questionText: "¿Existe un mecanismo formal para gestionar incidencias en tiempo real?" },
  { category: "Ejecución", questionText: "¿La coordinación entre áreas es fluida y oportuna?" },
  { category: "Control", questionText: "¿Se utilizan indicadores de seguimiento para monitorear el proceso semanalmente?" },
  { category: "Control", questionText: "¿Se realizan auditorías internas periódicas sobre el proceso?" },
  { category: "Control", questionText: "¿Existe un mecanismo de retroalimentación del cliente interno y externo?" },
  { category: "Mejora", questionText: "¿Hay proyectos de mejora activos relacionados con este proceso?" },
  { category: "Mejora", questionText: "¿Existe una cultura organizacional que promueva la mejora continua?" },
  { category: "Mejora", questionText: "¿Se utilizan datos y análisis para la toma de decisiones operativas?" },
  { category: "Contexto", questionText: "¿Existe un plan de contingencia ante interrupciones externas (energía, suministros, transporte)?" },
  { category: "Contexto", questionText: "¿Se gestiona activamente la reposición de materiales o insumos críticos?" },
  { category: "Contexto", questionText: "¿Hay planes alternativos ante fallas de proveedores clave?" },
];

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
    const gate = await requireCaseInOrganization(caseId);
    if ("error" in gate) return { error: gate.error };

    let rows = await db
      .select()
      .from(diagnosticQuestions)
      .where(eq(diagnosticQuestions.caseId, caseId))
      .orderBy(asc(diagnosticQuestions.orderIndex));

    if (rows.length === 0) {
      if (isReadOnlyRole(gate.ctx.role)) {
        return { data: [] };
      }
      rows = await db
        .insert(diagnosticQuestions)
        .values(
          DEFAULT_QUESTIONS.map((q, i) => ({
            caseId,
            orderIndex: i + 1,
            category: q.category,
            questionText: q.questionText,
          })),
        )
        .returning();
    }

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getDiagnosticResponses(caseId: string) {
  try {
    const gate = await requireCaseInOrganization(caseId);
    if ("error" in gate) return { error: gate.error };

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

  const writeGate = await requireWritableCase(caseId);
  if ("error" in writeGate) return { error: writeGate.error };

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

    revalidatePath(`/dashboard/cases/${caseId}`);
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

  const writeGate = await requireWritableCase(caseId);
  if ("error" in writeGate) return { error: writeGate.error };

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

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { data: results };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
