"use server";

import { generateStructured } from "@/server/ai/generate";
import {
  diagnosticSummarySchema,
  vsmAnalysisSchema,
  riskRecommendationsSchema,
  wasteCostExplanationSchema,
  prioritizationReviewSchema,
  actionPlanSuggestionsSchema,
  weeklyReviewSchema,
  executiveReportSchema,
  improvementNarrativeSchema,
  scamperIdeasSchema,
  riskGenerationSchema,
  initiativeGenerationSchema,
  actionPlanGenerationSchema,
} from "@/server/ai/schemas";
import {
  diagnosticPrompt,
  vsmPrompt,
  riskPrompt,
  wastePrompt,
  prioritizationPrompt,
  actionPlanPrompt,
  weeklyReviewPrompt,
  executiveReportPrompt,
  improvementNarrativePrompt,
  scamperPrompt,
  riskGenerationPrompt,
  initiativeGenerationPrompt,
  actionPlanGenerationPrompt,
} from "@/server/ai/prompts";
import { getProcessSteps } from "@/server/actions/vsm";
import { getRiskItems } from "@/server/actions/risks";
import { getWasteItems } from "@/server/actions/waste";
import { getDiagnosticResponses } from "@/server/actions/diagnostic";
import { getInitiatives } from "@/server/actions/prioritization";
import { getCase } from "@/server/actions/cases";
import { requireCaseInOrganization } from "@/server/auth/guards";
import { getModel } from "@/server/ai/client";
import { assertAiRateLimit, assertOrgAiVolumeLimit, recordAiInteraction } from "@/server/ai/rate-limit";

export type AIActionType =
  | "diagnostic_summary"
  | "vsm_analysis"
  | "risk_recommendations"
  | "waste_explanation"
  | "prioritization_review"
  | "action_plan_suggestions"
  | "weekly_review"
  | "executive_report"
  | "risk_generation"
  | "initiative_generation"
  | "action_plan_generation"
  | "improvement_narrative"
  | "scamper_ideas";

const SCHEMA_MAP = {
  diagnostic_summary: { schema: diagnosticSummarySchema, promptFn: diagnosticPrompt, name: "diagnostic_summary" },
  vsm_analysis: { schema: vsmAnalysisSchema, promptFn: vsmPrompt, name: "vsm_analysis" },
  risk_recommendations: { schema: riskRecommendationsSchema, promptFn: riskPrompt, name: "risk_recommendations" },
  waste_explanation: { schema: wasteCostExplanationSchema, promptFn: wastePrompt, name: "waste_explanation" },
  prioritization_review: { schema: prioritizationReviewSchema, promptFn: prioritizationPrompt, name: "prioritization_review" },
  action_plan_suggestions: { schema: actionPlanSuggestionsSchema, promptFn: actionPlanPrompt, name: "action_plan_suggestions" },
  weekly_review: { schema: weeklyReviewSchema, promptFn: weeklyReviewPrompt, name: "weekly_review" },
  executive_report: { schema: executiveReportSchema, promptFn: executiveReportPrompt, name: "executive_report" },
  risk_generation: { schema: riskGenerationSchema, promptFn: riskGenerationPrompt, name: "risk_generation" },
  initiative_generation: { schema: initiativeGenerationSchema, promptFn: initiativeGenerationPrompt, name: "initiative_generation" },
  action_plan_generation: { schema: actionPlanGenerationSchema, promptFn: actionPlanGenerationPrompt, name: "action_plan_generation" },
  improvement_narrative: { schema: improvementNarrativeSchema, promptFn: improvementNarrativePrompt, name: "improvement_narrative" },
  scamper_ideas: { schema: scamperIdeasSchema, promptFn: scamperPrompt, name: "scamper_ideas" },
} as const;

export async function getAIInsight(
  actionType: AIActionType,
  context: string,
  caseId: string,
): Promise<{ data: unknown; error: string | null }> {
  if (!process.env.OPENAI_API_KEY) {
    return { data: null, error: "API key de OpenAI no configurada" };
  }

  const gate = await requireCaseInOrganization(caseId);
  if ("error" in gate) {
    return { data: null, error: gate.error };
  }

  const limit = await assertAiRateLimit(gate.ctx.appUserId);
  if (limit) {
    return { data: null, error: limit.error };
  }

  const orgLimit = await assertOrgAiVolumeLimit(gate.ctx.organizationId);
  if (orgLimit) {
    return { data: null, error: orgLimit.error };
  }

  const config = SCHEMA_MAP[actionType];
  if (!config) {
    return { data: null, error: `Tipo de acción no soportado: ${actionType}` };
  }

  const prompt = config.promptFn(context);
  const result = await generateStructured(prompt, config.schema, config.name);

  if (!result.error && result.data != null) {
    await recordAiInteraction({
      appUserId: gate.ctx.appUserId,
      caseId,
      module: actionType,
      actionType,
      modelUsed: getModel(),
      tokensUsed: result.tokensUsed,
    });
  }

  return { data: result.data, error: result.error };
}

/**
 * Generate AI content using cross-module data fetched server-side.
 * Unlike getAIInsight (where the client builds context), this function
 * fetches data from multiple modules automatically based on actionType.
 */
export async function generateFromAI(
  caseId: string,
  actionType: "risk_generation" | "initiative_generation" | "action_plan_generation"
): Promise<{ data: unknown; error: string | null }> {
  if (!process.env.OPENAI_API_KEY) {
    return { data: null, error: "API key de OpenAI no configurada" };
  }

  const gate = await requireCaseInOrganization(caseId);
  if ("error" in gate) {
    return { data: null, error: gate.error };
  }

  const limit = await assertAiRateLimit(gate.ctx.appUserId);
  if (limit) {
    return { data: null, error: limit.error };
  }

  const orgLimit = await assertOrgAiVolumeLimit(gate.ctx.organizationId);
  if (orgLimit) {
    return { data: null, error: orgLimit.error };
  }

  const caseResult = await getCase(caseId);
  const caseData = caseResult.data;
  const caseHeader = caseData
    ? `Empresa: ${caseData.companyName ?? "N/A"}\nSector: ${caseData.sector ?? "N/A"}\nProceso: ${caseData.processFocus ?? "N/A"}\n`
    : "";

  let context: string;

  switch (actionType) {
    case "risk_generation": {
      const { data: steps } = await getProcessSteps(caseId);
      if (!steps || steps.length === 0) {
        return { data: null, error: "No hay pasos de VSM cargados. Completa el módulo de VSM primero." };
      }
      const stepsText = steps.map((s, i) =>
        `${i + 1}. ${s.stepName} (${s.department ?? "?"}) — Proceso: ${s.processTimeMinutes}min, Espera: ${s.waitTimeHours}h, Retrabajo: ${s.reworkPercentage}%, Valor: ${s.addsValue ? "Sí" : "No"}`
      ).join("\n");
      context = `${caseHeader}\nPASOS DEL VSM:\n${stepsText}`;
      break;
    }

    case "initiative_generation": {
      const [{ data: risks }, { data: waste }, { data: diagnostic }] = await Promise.all([
        getRiskItems(caseId),
        getWasteItems(caseId),
        getDiagnosticResponses(caseId),
      ]);

      const parts: string[] = [caseHeader];

      if (risks && risks.length > 0) {
        parts.push("RIESGOS:\n" + risks.map((r, i) =>
          `${i + 1}. [${r.riskType}] ${r.riskDescription} — Prob: ${r.probability}, Imp: ${r.impact}, Exp: ${Number(r.probability) * Number(r.impact)}`
        ).join("\n"));
      }

      if (waste && waste.length > 0) {
        parts.push("DESPERDICIOS:\n" + waste.map((w, i) =>
          `${i + 1}. ${w.problemDescription} — ${w.frequencyPerWeek}x/sem, ${w.minutesLostPerEvent}min/evento, Costo laboral: $${w.hourlyLaborCost}/h`
        ).join("\n"));
      }

      if (diagnostic && diagnostic.length > 0) {
        const avgScore = diagnostic.reduce((sum, d) => sum + Number(d.score), 0) / diagnostic.length;
        parts.push(`DIAGNÓSTICO: Promedio madurez: ${avgScore.toFixed(1)}/5 (${diagnostic.length} respuestas)`);
      }

      if (parts.length <= 1) {
        return { data: null, error: "No hay datos suficientes. Completa al menos el módulo de Riesgos o Desperdicio primero." };
      }

      context = parts.join("\n\n");
      break;
    }

    case "action_plan_generation": {
      const { data: initiatives } = await getInitiatives(caseId);
      if (!initiatives || initiatives.length === 0) {
        return { data: null, error: "No hay iniciativas priorizadas. Completa el módulo de Priorización primero." };
      }
      const initText = initiatives.map((init, i) =>
        `${i + 1}. ${init.name} (${init.description ?? ""}) — Score: ${init.totalScore ?? "?"}, Clasificación: ${init.classification ?? "?"}`
      ).join("\n");
      context = `${caseHeader}\nINICIATIVAS PRIORIZADAS:\n${initText}`;
      break;
    }
  }

  const config = SCHEMA_MAP[actionType];
  const prompt = config.promptFn(context);
  const result = await generateStructured(prompt, config.schema, config.name);

  if (!result.error && result.data != null) {
    await recordAiInteraction({
      appUserId: gate.ctx.appUserId,
      caseId,
      module: actionType,
      actionType,
      modelUsed: getModel(),
      tokensUsed: result.tokensUsed,
    });
  }

  return { data: result.data, error: result.error };
}
