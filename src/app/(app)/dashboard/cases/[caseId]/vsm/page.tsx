import { VSMTable } from "@/features/vsm/components/vsm-table";
import { VSMFutureManager } from "@/features/vsm/components/vsm-future-manager";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getProcessSteps, hasFutureVSM } from "@/server/actions/vsm";

export default async function VSMPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  const [currentResult, futureResult, hasFuture] = await Promise.all([
    getProcessSteps(caseId, "current"),
    getProcessSteps(caseId, "future"),
    hasFutureVSM(caseId),
  ]);

  const currentSteps = currentResult.data ?? [];
  const futureSteps = futureResult.data ?? [];
  const futureExists = hasFuture.data ?? false;

  return (
    <ModulePage guide={MODULE_GUIDES.vsm}>
      <VSMFutureManager
        caseId={caseId}
        currentSteps={currentSteps}
        futureSteps={futureSteps}
        futureExists={futureExists}
      />
    </ModulePage>
  );
}
