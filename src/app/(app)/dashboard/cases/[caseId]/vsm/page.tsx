import { VSMFutureManager } from "@/features/vsm/components/vsm-future-manager";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getProcessSteps, hasFutureVSM } from "@/server/actions/vsm";
import { getInitiatives } from "@/server/actions/prioritization";
import { getRiskItems } from "@/server/actions/risks";
import { getWasteItems } from "@/server/actions/waste";
import { getCase } from "@/server/actions/cases";
import { getScenarios, getScenarioSteps } from "@/server/actions/scenarios";
import { calculateVSM } from "@/lib/calculations/vsm";
import { calculateExposure } from "@/lib/calculations/risk";
import { calculateWasteCost } from "@/lib/calculations/waste";
import { buildScamperContext } from "@/lib/calculations/scamper-context";

export default async function VSMPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  const [currentResult, futureResult, hasFuture, initiativesResult, scenariosResult, caseResult, risksResult, wasteResult] = await Promise.all([
    getProcessSteps(caseId, "current"),
    getProcessSteps(caseId, "future"),
    hasFutureVSM(caseId),
    getInitiatives(caseId),
    getScenarios(caseId),
    getCase(caseId),
    getRiskItems(caseId),
    getWasteItems(caseId),
  ]);

  const currentSteps = currentResult.data ?? [];
  const futureSteps = futureResult.data ?? [];
  const futureExists = hasFuture.data ?? false;
  const initiatives = (initiativesResult.data ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    classification: i.classification,
  }));

  // Load steps for each scenario
  const rawScenarios = scenariosResult.data ?? [];
  const scenarios = await Promise.all(
    rawScenarios.map(async (s) => {
      const stepsResult = await getScenarioSteps(s.id);
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        steps: stepsResult.data ?? [],
      };
    }),
  );

  // Build SCAMPER context server-side
  const caseData = caseResult.data;
  const risks = risksResult.data ?? [];
  const wastes = wasteResult.data ?? [];

  const vsmMetrics = currentSteps.length > 0
    ? calculateVSM(currentSteps.map((s) => ({
        processTimeMinutes: Number(s.processTimeMinutes) || 0,
        waitTimeHours: Number(s.waitTimeHours) || 0,
        reworkPercentage: Number(s.reworkPercentage ?? 0),
        addsValue: s.addsValue ?? false,
      })))
    : null;

  const scamperContext = buildScamperContext({
    companyName: caseData?.companyName ?? "Sin nombre",
    sector: caseData?.sector ?? "Sin sector",
    processFocus: caseData?.processFocus ?? "Sin proceso",
    steps: currentSteps.map((s) => ({
      stepName: s.stepName,
      department: s.department,
      processTimeMinutes: Number(s.processTimeMinutes) || 0,
      waitTimeHours: Number(s.waitTimeHours) || 0,
      reworkPercentage: Number(s.reworkPercentage ?? 0),
      addsValue: s.addsValue ?? false,
    })),
    risks: risks.map((r) => ({
      description: r.riskDescription,
      type: r.riskType ?? "Otro",
      exposure: calculateExposure(Number(r.probability), Number(r.impact)),
    })),
    wastes: wastes.map((w) => ({
      problem: w.problemDescription,
      costMonthly: calculateWasteCost({
        frequencyPerWeek: Number(w.frequencyPerWeek),
        minutesLostPerEvent: Number(w.minutesLostPerEvent),
        hourlyLaborCost: Number(w.hourlyLaborCost),
        unitsAffected: Number(w.unitsAffected ?? 0),
        unitMargin: Number(w.unitMargin ?? 0),
      }).totalCostMonthly,
    })),
    metrics: vsmMetrics ? {
      leadTimeHours: vsmMetrics.leadTimeHours,
      flowEfficiency: vsmMetrics.flowEfficiency,
      avgRework: vsmMetrics.avgRework,
      stepsCount: vsmMetrics.stepsCount,
    } : null,
  });

  return (
    <ModulePage guide={MODULE_GUIDES.vsm}>
      <VSMFutureManager
        caseId={caseId}
        currentSteps={currentSteps}
        futureSteps={futureSteps}
        futureExists={futureExists}
        initiatives={initiatives}
        scenarios={scenarios}
        scamperContext={scamperContext}
      />
    </ModulePage>
  );
}
