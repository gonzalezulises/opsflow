"use server";

import { requireCaseInOrganization } from "@/server/auth/guards";
import { getCase } from "@/server/actions/cases";
import { getDiagnosticResponses } from "@/server/actions/diagnostic";
import { getProcessSteps } from "@/server/actions/vsm";
import { getRiskItems } from "@/server/actions/risks";
import { getWasteItems } from "@/server/actions/waste";
import { getInitiatives } from "@/server/actions/prioritization";
import { getActionItems } from "@/server/actions/plan";
import { getWeeklyMetrics } from "@/server/actions/tracking";

/**
 * Serializes core case artefacts for audit / offline review (JSON download).
 */
export async function exportCaseReportJson(caseId: string): Promise<
  { data: string } | { error: string }
> {
  const gate = await requireCaseInOrganization(caseId);
  if ("error" in gate) return { error: gate.error };

  const [
    caseResult,
    diagnosticResult,
    stepsCurrent,
    stepsFuture,
    risksResult,
    wasteResult,
    initiativesResult,
    actionsResult,
    trackingResult,
  ] = await Promise.all([
    getCase(caseId),
    getDiagnosticResponses(caseId),
    getProcessSteps(caseId, "current"),
    getProcessSteps(caseId, "future"),
    getRiskItems(caseId),
    getWasteItems(caseId),
    getInitiatives(caseId),
    getActionItems(caseId),
    getWeeklyMetrics(caseId),
  ]);

  if ("error" in caseResult) {
    return { error: caseResult.error ?? "No se pudo cargar el caso." };
  }

  const bundle = {
    exportedAt: new Date().toISOString(),
    caseId,
    case: caseResult.data,
    diagnosticResponses: diagnosticResult.data ?? [],
    processStepsCurrent: stepsCurrent.data ?? [],
    processStepsFuture: stepsFuture.data ?? [],
    riskItems: risksResult.data ?? [],
    wasteItems: wasteResult.data ?? [],
    initiatives: initiativesResult.data ?? [],
    actionItems: actionsResult.data ?? [],
    weeklyMetrics: trackingResult.data ?? [],
  };

  return { data: JSON.stringify(bundle, null, 2) };
}
