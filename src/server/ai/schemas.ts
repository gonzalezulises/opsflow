import { z } from "zod";

export const diagnosticSummarySchema = z.object({
  overallAssessment: z.string().describe("Evaluación general del nivel de madurez"),
  criticalFindings: z.array(z.string()).describe("Hallazgos críticos identificados"),
  contradictions: z.array(z.string()).describe("Contradicciones detectadas entre respuestas"),
  focusAreas: z.array(z.string()).describe("Áreas foco recomendadas"),
  quickWins: z.array(z.string()).describe("Mejoras rápidas sugeridas"),
});

export const vsmAnalysisSchema = z.object({
  bottleneck: z.object({
    step: z.string(),
    reason: z.string(),
  }).describe("Principal cuello de botella"),
  waitTimeAnalysis: z.string().describe("Análisis de tiempos de espera"),
  reworkConcerns: z.array(z.object({
    step: z.string(),
    issue: z.string(),
    suggestion: z.string(),
  })).describe("Preocupaciones de retrabajo"),
  handoffRisks: z.array(z.string()).describe("Riesgos de coordinación entre áreas"),
  quickWins: z.array(z.object({
    action: z.string(),
    expectedImpact: z.string(),
  })).describe("Oportunidades quick win"),
  flowEfficiencyComment: z.string().describe("Comentario sobre la eficiencia de flujo"),
});

export const riskRecommendationsSchema = z.object({
  priorityRisk: z.object({
    description: z.string(),
    rationale: z.string(),
  }).describe("Riesgo más prioritario y por qué"),
  earlySignals: z.array(z.object({
    risk: z.string(),
    signals: z.array(z.string()),
  })).describe("Señales tempranas propuestas por riesgo"),
  mitigations: z.array(z.object({
    risk: z.string(),
    actions: z.array(z.string()),
  })).describe("Mitigaciones propuestas"),
  contextualInsights: z.string().describe("Insights considerando el contexto Venezuela"),
});

export const wasteCostExplanationSchema = z.object({
  totalImpact: z.string().describe("Explicación del impacto total"),
  topWaste: z.object({
    problem: z.string(),
    explanation: z.string(),
    sensitivity: z.string(),
  }).describe("Principal fuga con análisis de sensibilidad"),
  assumptions: z.array(z.object({
    assumption: z.string(),
    impact: z.string(),
  })).describe("Supuestos clave y su impacto en el cálculo"),
  biggestOpportunity: z.string().describe("Mayor oportunidad económica"),
});

export const prioritizationReviewSchema = z.object({
  assessment: z.string().describe("Evaluación general de la priorización"),
  inconsistencies: z.array(z.object({
    initiative: z.string(),
    issue: z.string(),
    suggestion: z.string(),
  })).describe("Inconsistencias detectadas"),
  recommendedOrder: z.array(z.object({
    initiative: z.string(),
    rationale: z.string(),
  })).describe("Orden recomendado con justificación"),
});

export const actionPlanSuggestionsSchema = z.object({
  assessment: z.string().describe("Evaluación del plan"),
  vagueActions: z.array(z.object({
    action: z.string(),
    issue: z.string(),
    improvedVersion: z.string(),
  })).describe("Acciones vagas o no medibles"),
  missingActions: z.array(z.string()).describe("Acciones faltantes recomendadas"),
  riskFlags: z.array(z.string()).describe("Riesgos del plan actual"),
});

export const weeklyReviewSchema = z.object({
  summary: z.string().describe("Resumen de la semana"),
  improvements: z.array(z.string()).describe("Métricas que mejoraron"),
  deteriorations: z.array(z.string()).describe("Métricas que empeoraron"),
  emergingRisks: z.array(z.string()).describe("Riesgos emergentes"),
  recommendation: z.string().describe("Recomendación principal de ajuste"),
});

export const executiveReportSchema = z.object({
  executiveSummary: z.string().describe("Resumen ejecutivo en 3-4 oraciones"),
  keyFindings: z.array(z.object({
    area: z.string(),
    finding: z.string(),
    impact: z.string(),
  })).describe("Hallazgos clave por área"),
  topRecommendations: z.array(z.object({
    recommendation: z.string(),
    priority: z.string(),
    timeline: z.string(),
  })).describe("Top 3-5 recomendaciones"),
  outlook: z.string().describe("Perspectiva a 30-60 días"),
});

export type DiagnosticSummary = z.infer<typeof diagnosticSummarySchema>;
export type VSMAnalysis = z.infer<typeof vsmAnalysisSchema>;
export type RiskRecommendations = z.infer<typeof riskRecommendationsSchema>;
export type WasteCostExplanation = z.infer<typeof wasteCostExplanationSchema>;
export type PrioritizationReview = z.infer<typeof prioritizationReviewSchema>;
export type ActionPlanSuggestions = z.infer<typeof actionPlanSuggestionsSchema>;
export type WeeklyReview = z.infer<typeof weeklyReviewSchema>;
export type ExecutiveReport = z.infer<typeof executiveReportSchema>;
