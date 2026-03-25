import { ExecutiveReport } from "@/features/reports/components/executive-report";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getCase } from "@/server/actions/cases";
import { getDiagnosticResponses } from "@/server/actions/diagnostic";
import { getProcessSteps } from "@/server/actions/vsm";
import { getRiskItems } from "@/server/actions/risks";
import { getWasteItems } from "@/server/actions/waste";
import { getInitiatives } from "@/server/actions/prioritization";
import { getActionItems } from "@/server/actions/plan";
import { getWeeklyMetrics } from "@/server/actions/tracking";
import { calculateDiagnostic } from "@/lib/calculations/diagnostic";
import { calculateVSM } from "@/lib/calculations/vsm";
import { calculateExposure, getRiskLevel } from "@/lib/calculations/risk";
import { calculateWasteCost } from "@/lib/calculations/waste";
import { calculatePrioritizationScore } from "@/lib/calculations/prioritization";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  const [
    caseResult,
    diagnosticResult,
    stepsResult,
    risksResult,
    wasteResult,
    initiativesResult,
    actionsResult,
    trackingResult,
  ] = await Promise.all([
    getCase(caseId),
    getDiagnosticResponses(caseId),
    getProcessSteps(caseId),
    getRiskItems(caseId),
    getWasteItems(caseId),
    getInitiatives(caseId),
    getActionItems(caseId),
    getWeeklyMetrics(caseId),
  ]);

  const caseData = caseResult.data;
  const diagnosticResponses = diagnosticResult.data ?? [];
  const steps = stepsResult.data ?? [];
  const risks = risksResult.data ?? [];
  const wasteItems = wasteResult.data ?? [];
  const initiatives = initiativesResult.data ?? [];
  const actions = actionsResult.data ?? [];
  const weeklyMetrics = trackingResult.data ?? [];

  // Diagnostic
  const diagnosticScores = diagnosticResponses.map((r) => Number(r.score));
  const diagnostic = diagnosticScores.length > 0 ? calculateDiagnostic(diagnosticScores) : null;

  // VSM
  const vsm = steps.length > 0
    ? calculateVSM(
        steps.map((s) => ({
          processTimeMinutes: Number(s.processTimeMinutes),
          waitTimeHours: Number(s.waitTimeHours),
          addsValue: s.addsValue ?? false,
          reworkPercentage: Number(s.reworkPercentage ?? 0),
        }))
      )
    : null;

  // Bottleneck
  const bottleneck = steps.length > 0
    ? steps.reduce((max, s) =>
        Number(s.waitTimeHours) > Number(max.waitTimeHours) ? s : max,
        steps[0]
      )
    : null;

  // Risks ranked
  const rankedRisks = risks
    .map((r) => ({
      ...r,
      exposure: calculateExposure(Number(r.probability), Number(r.impact)),
      level: getRiskLevel(calculateExposure(Number(r.probability), Number(r.impact))),
    }))
    .sort((a, b) => b.exposure - a.exposure);
  const topRisk = rankedRisks[0] ?? null;
  const criticalRiskCount = rankedRisks.filter((r) => r.level === "critical" || r.level === "high").length;

  // Waste ranked
  const rankedWaste = wasteItems
    .map((w) => ({
      ...w,
      ...calculateWasteCost({
        frequencyPerWeek: Number(w.frequencyPerWeek),
        minutesLostPerEvent: Number(w.minutesLostPerEvent),
        hourlyLaborCost: Number(w.hourlyLaborCost),
        unitsAffected: Number(w.unitsAffected ?? 0),
        unitMargin: Number(w.unitMargin ?? 0),
      }),
    }))
    .sort((a, b) => b.totalCostMonthly - a.totalCostMonthly);
  const topWaste = rankedWaste[0] ?? null;
  const totalWasteCost = rankedWaste.reduce((sum, w) => sum + w.totalCostMonthly, 0);

  // Initiatives scored
  const scoredInitiatives = initiatives.map((init) => {
    const scores = {
      impactLeadTime: Number(init.impactLeadTime ?? 3),
      impactEconomic: Number(init.impactEconomic ?? 3),
      impactResilience: Number(init.impactResilience ?? 3),
      feasibility30d: Number(init.feasibility30d ?? 3),
      effort: Number(init.effort ?? 3),
      externalDependency: Number(init.externalDependency ?? 3),
    };
    const result = calculatePrioritizationScore(scores);
    return { ...init, ...result };
  }).sort((a, b) => b.totalScore - a.totalScore);

  const attackNow = scoredInitiatives.filter((i) => i.classification === "Atacar ya");

  // Actions summary
  const totalActions = actions.length;
  const completedActions = actions.filter((a) => a.status === "completed").length;
  const blockedActions = actions.filter((a) => a.status === "blocked").length;
  const progressPct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Tracking
  const lastWeek = weeklyMetrics.length > 0
    ? weeklyMetrics.sort((a, b) => Number(b.weekNumber) - Number(a.weekNumber))[0]
    : null;

  const reportData = {
    case: {
      companyName: caseData?.companyName ?? "Sin nombre",
      sector: caseData?.sector ?? "Sin sector",
      processFocus: caseData?.processFocus ?? "Sin proceso",
      currency: caseData?.currency ?? "USD",
    },
    diagnostic: diagnostic
      ? { average: diagnostic.average, level: diagnostic.level, respondedCount: diagnostic.respondedCount }
      : null,
    vsm: vsm
      ? {
          leadTimeHours: vsm.leadTimeHours,
          leadTimeDays: vsm.leadTimeDays,
          flowEfficiency: vsm.flowEfficiency,
          totalProcessTimeMinutes: vsm.totalProcessTimeMinutes,
          totalWaitTimeHours: vsm.totalWaitTimeHours,
          avgRework: vsm.avgRework,
          stepsCount: vsm.stepsCount,
        }
      : null,
    bottleneck: bottleneck
      ? {
          stepName: bottleneck.stepName,
          department: bottleneck.department,
          waitTimeHours: Number(bottleneck.waitTimeHours),
          reworkPercentage: Number(bottleneck.reworkPercentage ?? 0),
        }
      : null,
    topRisk: topRisk
      ? {
          description: topRisk.riskDescription,
          type: topRisk.riskType ?? "Otro",
          probability: Number(topRisk.probability),
          impact: Number(topRisk.impact),
          exposure: topRisk.exposure,
        }
      : null,
    risksCount: risks.length,
    criticalRiskCount,
    topWaste: topWaste
      ? {
          problem: topWaste.problemDescription,
          totalCostMonthly: topWaste.totalCostMonthly,
        }
      : null,
    totalWasteCost,
    wasteCount: wasteItems.length,
    attackNow: attackNow.map((i) => ({ name: i.name, score: i.totalScore })),
    allInitiatives: scoredInitiatives.map((i) => ({
      name: i.name,
      score: i.totalScore,
      classification: i.classification,
    })),
    initiativesCount: initiatives.length,
    topRisks: rankedRisks.slice(0, 5).map((r) => ({
      description: r.riskDescription,
      type: r.riskType ?? "Otro",
      exposure: r.exposure,
    })),
    topWasteItems: rankedWaste.slice(0, 5).map((w) => ({
      problem: w.problemDescription,
      totalCostMonthly: w.totalCostMonthly,
    })),
    actionsList: actions.map((a) => ({
      action: a.actionDescription,
      responsible: a.responsible ?? "",
      status: a.status,
    })),
    plan: { totalActions, completedActions, blockedActions, progressPct },
    lastWeek: lastWeek
      ? {
          weekNumber: Number(lastWeek.weekNumber),
          leadTime: lastWeek.leadTime ? Number(lastWeek.leadTime) : null,
          otdOtif: lastWeek.otdOtif ? Number(lastWeek.otdOtif) : null,
          planProgress: lastWeek.planProgress ? Number(lastWeek.planProgress) : null,
        }
      : null,
  };

  return (
    <ModulePage guide={MODULE_GUIDES.report}>
      <ExecutiveReport caseId={caseId} data={reportData} />
    </ModulePage>
  );
}
