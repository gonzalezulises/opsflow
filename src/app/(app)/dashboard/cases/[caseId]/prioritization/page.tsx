import { PrioritizationMatrix } from "@/features/prioritization/components/prioritization-matrix";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getInitiatives, getPrioritizationWeights } from "@/server/actions/prioritization";
import { getProcessSteps } from "@/server/actions/vsm";
import { getRiskItems } from "@/server/actions/risks";
import { getWasteItems } from "@/server/actions/waste";
import { getCase } from "@/server/actions/cases";
import { calculateVSM } from "@/lib/calculations/vsm";
import { calculateExposure } from "@/lib/calculations/risk";
import { calculateWasteCost } from "@/lib/calculations/waste";
import { buildScamperContext } from "@/lib/calculations/scamper-context";

export default async function PrioritizationPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  const [{ data: initiatives }, { data: weights }, stepsResult, risksResult, wasteResult, caseResult] = await Promise.all([
    getInitiatives(caseId),
    getPrioritizationWeights(caseId),
    getProcessSteps(caseId, "current"),
    getRiskItems(caseId),
    getWasteItems(caseId),
    getCase(caseId),
  ]);

  const steps = stepsResult.data ?? [];
  const risks = risksResult.data ?? [];
  const wastes = wasteResult.data ?? [];
  const caseData = caseResult.data;

  const vsmMetrics = steps.length > 0
    ? calculateVSM(steps.map((s) => ({
        processTimeMinutes: Number(s.processTimeMinutes) || 0,
        waitTimeHours: Number(s.waitTimeHours) || 0,
        reworkPercentage: Number(s.reworkPercentage ?? 0),
        addsValue: s.addsValue ?? false,
      })))
    : null;

  const scamperContext = steps.length > 0 ? buildScamperContext({
    companyName: caseData?.companyName ?? "Sin nombre",
    sector: caseData?.sector ?? "Sin sector",
    processFocus: caseData?.processFocus ?? "Sin proceso",
    steps: steps.map((s) => ({
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
  }) : undefined;

  return (
    <ModulePage guide={MODULE_GUIDES.prioritization}>
      <PrioritizationMatrix
        caseId={caseId}
        initialInitiatives={initiatives ?? []}
        initialWeights={weights}
        scamperContext={scamperContext}
      />
    </ModulePage>
  );
}
