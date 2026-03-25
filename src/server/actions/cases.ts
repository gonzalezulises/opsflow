"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, and, isNull, asc, desc, sql } from "drizzle-orm";
import { db } from "@/server/db";
import {
  cases,
  organizations,
  diagnosticQuestions,
  diagnosticResponses,
  processSteps,
  riskItems,
  wasteItems,
  initiatives,
  actionItems,
  weeklyMetrics,
  prioritizationWeights,
} from "@/server/db/schema";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";
const DEFAULT_TEMPLATE_ID = "00000000-0000-0000-0000-000000000002";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getOrCreateDefaultOrg(): Promise<string> {
  const [existing] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, DEFAULT_ORG_ID));

  if (existing) return existing.id;

  const [created] = await db
    .insert(organizations)
    .values({
      id: DEFAULT_ORG_ID,
      name: "OpsFlow Demo",
      slug: "opsflow-demo",
    })
    .returning();

  return created.id;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createCaseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  organizationId: z.string().uuid(),
  isTemplate: z.boolean().optional(),
  sector: z.string().optional(),
  companyName: z.string().optional(),
  processFocus: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
});

const updateCaseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").optional(),
  sector: z.string().optional(),
  companyName: z.string().optional(),
  processFocus: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  status: z.enum(["draft", "in_progress", "completed"]).optional(),
  metrics: z.unknown().optional(),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getCases() {
  try {
    const orgId = await getOrCreateDefaultOrg();
    const rows = await db
      .select()
      .from(cases)
      .where(
        and(
          eq(cases.organizationId, orgId),
          eq(cases.isTemplate, false),
          isNull(cases.deletedAt),
        ),
      )
      .orderBy(desc(cases.createdAt));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getCase(id: string) {
  try {
    const [row] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, id), isNull(cases.deletedAt)));

    if (!row) return { error: "Caso no encontrado" };

    const [dqCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(diagnosticQuestions)
      .where(eq(diagnosticQuestions.caseId, id));

    const [drCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(diagnosticResponses)
      .where(eq(diagnosticResponses.caseId, id));

    const [psCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(processSteps)
      .where(eq(processSteps.caseId, id));

    const [riCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(riskItems)
      .where(eq(riskItems.caseId, id));

    const [wiCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(wasteItems)
      .where(eq(wasteItems.caseId, id));

    const [inCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(initiatives)
      .where(eq(initiatives.caseId, id));

    const [aiCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(actionItems)
      .where(eq(actionItems.caseId, id));

    const [wmCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(weeklyMetrics)
      .where(eq(weeklyMetrics.caseId, id));

    return {
      data: {
        ...row,
        counts: {
          diagnosticQuestions: dqCount?.count ?? 0,
          diagnosticResponses: drCount?.count ?? 0,
          processSteps: psCount?.count ?? 0,
          riskItems: riCount?.count ?? 0,
          wasteItems: wiCount?.count ?? 0,
          initiatives: inCount?.count ?? 0,
          actionItems: aiCount?.count ?? 0,
          weeklyMetrics: wmCount?.count ?? 0,
        },
      },
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getTemplates() {
  try {
    const orgId = await getOrCreateDefaultOrg();
    const rows = await db
      .select()
      .from(cases)
      .where(
        and(
          eq(cases.organizationId, orgId),
          eq(cases.isTemplate, true),
          isNull(cases.deletedAt),
        ),
      )
      .orderBy(asc(cases.name));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getDefaultTemplateId(): Promise<string> {
  return DEFAULT_TEMPLATE_ID;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createCase(data: z.input<typeof createCaseSchema>) {
  const parsed = createCaseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const [row] = await db.insert(cases).values(parsed.data).returning();
    revalidatePath("/dashboard/cases");
    revalidatePath("/dashboard");
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function createBlankCase(name: string) {
  try {
    const orgId = await getOrCreateDefaultOrg();
    const [row] = await db
      .insert(cases)
      .values({
        name,
        organizationId: orgId,
        isTemplate: false,
        status: "draft",
      })
      .returning();

    revalidatePath("/dashboard/cases");
    revalidatePath("/dashboard");
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function createCaseFromTemplate(
  templateId: string,
  name: string,
) {
  try {
    const orgId = await getOrCreateDefaultOrg();

    const [template] = await db
      .select()
      .from(cases)
      .where(
        and(
          eq(cases.id, templateId),
          eq(cases.isTemplate, true),
          isNull(cases.deletedAt),
        ),
      );

    if (!template) return { error: "Template no encontrado" };

    const result = await db.transaction(async (tx) => {
      // 1. Create the new case
      const [newCase] = await tx
        .insert(cases)
        .values({
          name,
          organizationId: orgId,
          isTemplate: false,
          templateId,
          sector: template.sector,
          companyName: template.companyName,
          processFocus: template.processFocus,
          currency: template.currency,
          locale: template.locale,
          status: "draft",
        })
        .returning();

      const newCaseId = newCase.id;

      // 2. Copy diagnostic questions
      const templateQuestions = await tx
        .select()
        .from(diagnosticQuestions)
        .where(eq(diagnosticQuestions.caseId, templateId))
        .orderBy(asc(diagnosticQuestions.orderIndex));

      if (templateQuestions.length > 0) {
        await tx.insert(diagnosticQuestions).values(
          templateQuestions.map((q) => ({
            caseId: newCaseId,
            orderIndex: q.orderIndex,
            category: q.category,
            questionText: q.questionText,
            description: q.description,
          })),
        );
      }

      // 3. Copy process steps and build old->new ID map for risk items
      const templateSteps = await tx
        .select()
        .from(processSteps)
        .where(eq(processSteps.caseId, templateId))
        .orderBy(asc(processSteps.orderIndex));

      const stepIdMap = new Map<string, string>();
      if (templateSteps.length > 0) {
        const insertedSteps = await tx
          .insert(processSteps)
          .values(
            templateSteps.map((s) => ({
              caseId: newCaseId,
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
            })),
          )
          .returning();

        templateSteps.forEach((old, i) => {
          stepIdMap.set(old.id, insertedSteps[i].id);
        });
      }

      // 4. Copy risk items
      const templateRisks = await tx
        .select()
        .from(riskItems)
        .where(eq(riskItems.caseId, templateId));

      if (templateRisks.length > 0) {
        await tx.insert(riskItems).values(
          templateRisks.map((r) => ({
            caseId: newCaseId,
            processStepId: r.processStepId
              ? (stepIdMap.get(r.processStepId) ?? null)
              : null,
            riskDescription: r.riskDescription,
            riskType: r.riskType,
            probability: r.probability,
            impact: r.impact,
            exposure: r.exposure,
            earlySignals: r.earlySignals,
            mitigations: r.mitigations,
            additionalAction: r.additionalAction,
          })),
        );
      }

      // 5. Copy waste items
      const templateWaste = await tx
        .select()
        .from(wasteItems)
        .where(eq(wasteItems.caseId, templateId));

      if (templateWaste.length > 0) {
        await tx.insert(wasteItems).values(
          templateWaste.map((w) => ({
            caseId: newCaseId,
            problemDescription: w.problemDescription,
            frequencyPerWeek: w.frequencyPerWeek,
            minutesLostPerEvent: w.minutesLostPerEvent,
            hourlyLaborCost: w.hourlyLaborCost,
            unitsAffected: w.unitsAffected,
            unitMargin: w.unitMargin,
            laborCostMonthly: w.laborCostMonthly,
            marginLostMonthly: w.marginLostMonthly,
            totalCostMonthly: w.totalCostMonthly,
          })),
        );
      }

      // 6. Copy initiatives and build old->new ID map for action items
      const templateInitiatives = await tx
        .select()
        .from(initiatives)
        .where(eq(initiatives.caseId, templateId));

      const initiativeIdMap = new Map<string, string>();
      if (templateInitiatives.length > 0) {
        const insertedInitiatives = await tx
          .insert(initiatives)
          .values(
            templateInitiatives.map((i) => ({
              caseId: newCaseId,
              name: i.name,
              description: i.description,
              impactLeadTime: i.impactLeadTime,
              impactEconomic: i.impactEconomic,
              impactResilience: i.impactResilience,
              feasibility30d: i.feasibility30d,
              effort: i.effort,
              externalDependency: i.externalDependency,
              totalScore: i.totalScore,
              classification: i.classification,
            })),
          )
          .returning();

        templateInitiatives.forEach((old, idx) => {
          initiativeIdMap.set(old.id, insertedInitiatives[idx].id);
        });
      }

      // 7. Copy action items
      const templateActions = await tx
        .select()
        .from(actionItems)
        .where(eq(actionItems.caseId, templateId));

      if (templateActions.length > 0) {
        await tx.insert(actionItems).values(
          templateActions.map((a) => ({
            caseId: newCaseId,
            initiativeId: a.initiativeId
              ? (initiativeIdMap.get(a.initiativeId) ?? null)
              : null,
            actionDescription: a.actionDescription,
            responsible: a.responsible,
            startDate: a.startDate,
            endDate: a.endDate,
            leadMetric: a.leadMetric,
            baselineValue: a.baselineValue,
            targetValue: a.targetValue,
            contingency: a.contingency,
            status: "pending" as const,
          })),
        );
      }

      // 8. Copy prioritization weights
      const templateWeights = await tx
        .select()
        .from(prioritizationWeights)
        .where(eq(prioritizationWeights.caseId, templateId));

      if (templateWeights.length > 0) {
        const w = templateWeights[0];
        await tx.insert(prioritizationWeights).values({
          caseId: newCaseId,
          impactLeadTime: w.impactLeadTime,
          impactEconomic: w.impactEconomic,
          impactResilience: w.impactResilience,
          feasibility30d: w.feasibility30d,
          effort: w.effort,
          externalDependency: w.externalDependency,
        });
      }

      return newCase;
    });

    revalidatePath("/dashboard/cases");
    revalidatePath("/dashboard");
    return { data: result };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function updateCase(
  id: string,
  data: z.input<typeof updateCaseSchema>,
) {
  const parsed = updateCaseSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const values: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    // Remove undefined keys
    for (const key of Object.keys(values)) {
      if (values[key] === undefined) delete values[key];
    }

    const [row] = await db
      .update(cases)
      .set(values)
      .where(and(eq(cases.id, id), isNull(cases.deletedAt)))
      .returning();

    if (!row) return { error: "Caso no encontrado" };

    revalidatePath("/dashboard/cases");
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/cases/${id}`);
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function deleteCase(id: string) {
  try {
    const [row] = await db
      .update(cases)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(cases.id, id), isNull(cases.deletedAt)))
      .returning();

    if (!row) return { error: "Caso no encontrado" };

    revalidatePath("/dashboard/cases");
    revalidatePath("/dashboard");
    return { data: row };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
