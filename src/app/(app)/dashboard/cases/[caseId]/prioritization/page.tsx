import { PrioritizationMatrix } from "@/features/prioritization/components/prioritization-matrix";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getInitiatives, getPrioritizationWeights } from "@/server/actions/prioritization";

export default async function PrioritizationPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const [{ data: initiatives }, { data: weights }] = await Promise.all([
    getInitiatives(caseId),
    getPrioritizationWeights(caseId),
  ]);

  return (
    <ModulePage guide={MODULE_GUIDES.prioritization}>
      <PrioritizationMatrix
        caseId={caseId}
        initialInitiatives={initiatives ?? []}
        initialWeights={weights}
      />
    </ModulePage>
  );
}
