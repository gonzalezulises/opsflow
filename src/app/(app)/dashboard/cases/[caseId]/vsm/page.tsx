import { VSMFutureManager } from "@/features/vsm/components/vsm-future-manager";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getProcessSteps, hasFutureVSM } from "@/server/actions/vsm";
import { getInitiatives } from "@/server/actions/prioritization";
import { getScenarios, getScenarioSteps } from "@/server/actions/scenarios";

export default async function VSMPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  const [currentResult, futureResult, hasFuture, initiativesResult, scenariosResult] = await Promise.all([
    getProcessSteps(caseId, "current"),
    getProcessSteps(caseId, "future"),
    hasFutureVSM(caseId),
    getInitiatives(caseId),
    getScenarios(caseId),
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

  return (
    <ModulePage guide={MODULE_GUIDES.vsm}>
      <VSMFutureManager
        caseId={caseId}
        currentSteps={currentSteps}
        futureSteps={futureSteps}
        futureExists={futureExists}
        initiatives={initiatives}
        scenarios={scenarios}
      />
    </ModulePage>
  );
}
