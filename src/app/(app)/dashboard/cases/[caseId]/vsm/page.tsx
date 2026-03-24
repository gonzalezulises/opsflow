import { VSMTable } from "@/features/vsm/components/vsm-table";
import { ModuleGuide } from "@/components/shared/module-guide";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Value Stream Map</h2>
        <p className="text-sm text-muted-foreground">
          Mapea los pasos del proceso, identifica tiempos de espera y calcula la
          eficiencia de flujo
        </p>
      </div>
      <ModuleGuide content={MODULE_GUIDES.vsm} />
      <VSMTable caseId={caseId} initialSteps={steps} />
    </div>
  );
}
