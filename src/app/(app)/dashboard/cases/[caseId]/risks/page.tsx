import { RiskMatrix } from "@/features/risks/components/risk-matrix";
import { ModulePage } from "@/components/shared/module-page";
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
    <ModulePage guide={MODULE_GUIDES.risks}>
      <RiskMatrix caseId={caseId} initialRisks={risks} />
    </ModulePage>
  );
}
