import { VSMTable } from "@/features/vsm/components/vsm-table";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getProcessSteps } from "@/server/actions/vsm";

export default async function VSMPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const result = await getProcessSteps(caseId);
  const steps = result.data ?? [];

  return (
    <ModulePage guide={MODULE_GUIDES.vsm}>
      <VSMTable caseId={caseId} initialSteps={steps} />
    </ModulePage>
  );
}
