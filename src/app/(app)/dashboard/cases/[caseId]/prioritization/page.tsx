import { PrioritizationMatrix } from "@/features/prioritization/components/prioritization-matrix";
import { ModuleGuide } from "@/components/shared/module-guide";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Priorización de iniciativas</h2>
        <p className="text-sm text-muted-foreground">
          Evalúa y clasifica iniciativas según impacto, factibilidad y esfuerzo
        </p>
      </div>
      <ModuleGuide content={MODULE_GUIDES.prioritization} />
      <PrioritizationMatrix
        caseId={caseId}
        initialInitiatives={initiatives ?? []}
        initialWeights={weights}
      />
    </div>
  );
}
