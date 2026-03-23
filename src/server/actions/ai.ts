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
} from "@/server/ai/prompts";

export type AIActionType =
  | "diagnostic_summary"
  | "vsm_analysis"
  | "risk_recommendations"
  | "waste_explanation"
  | "prioritization_review"
  | "action_plan_suggestions"
  | "weekly_review"
  | "executive_report";

const SCHEMA_MAP = {
  diagnostic_summary: { schema: diagnosticSummarySchema, promptFn: diagnosticPrompt, name: "diagnostic_summary" },
  vsm_analysis: { schema: vsmAnalysisSchema, promptFn: vsmPrompt, name: "vsm_analysis" },
  risk_recommendations: { schema: riskRecommendationsSchema, promptFn: riskPrompt, name: "risk_recommendations" },
  waste_explanation: { schema: wasteCostExplanationSchema, promptFn: wastePrompt, name: "waste_explanation" },
  prioritization_review: { schema: prioritizationReviewSchema, promptFn: prioritizationPrompt, name: "prioritization_review" },
  action_plan_suggestions: { schema: actionPlanSuggestionsSchema, promptFn: actionPlanPrompt, name: "action_plan_suggestions" },
  weekly_review: { schema: weeklyReviewSchema, promptFn: weeklyReviewPrompt, name: "weekly_review" },
  executive_report: { schema: executiveReportSchema, promptFn: executiveReportPrompt, name: "executive_report" },
} as const;

export async function getAIInsight(
  actionType: AIActionType,
  context: string
): Promise<{ data: unknown; error: string | null }> {
  if (!process.env.OPENAI_API_KEY) {
    return { data: null, error: "API key de OpenAI no configurada" };
  }

  const config = SCHEMA_MAP[actionType];
  if (!config) {
    return { data: null, error: `Tipo de acción no soportado: ${actionType}` };
  }

  const prompt = config.promptFn(context);
  const result = await generateStructured(prompt, config.schema, config.name);

  return { data: result.data, error: result.error };
}
