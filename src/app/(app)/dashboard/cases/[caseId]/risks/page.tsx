import { RiskMatrix } from "@/features/risks/components/risk-matrix";
import { ModuleGuide } from "@/components/shared/module-guide";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getRiskItems } from "@/server/actions/risks";

export default async function RisksPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const result = await getRiskItems(caseId);
  const risks = result.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Riesgo contextual</h2>
        <p className="text-sm text-muted-foreground">
          Identifica y evalúa riesgos por paso del proceso, considerando el contexto operativo
        </p>
      </div>
      <ModuleGuide content={MODULE_GUIDES.risks} />
      <RiskMatrix caseId={caseId} initialRisks={risks} />
    </div>
  );
}
