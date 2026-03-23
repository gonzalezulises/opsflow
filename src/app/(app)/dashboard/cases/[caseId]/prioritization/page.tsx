import { PrioritizationMatrix } from "@/features/prioritization/components/prioritization-matrix";

export default async function PrioritizationPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Priorización de iniciativas</h2>
        <p className="text-sm text-muted-foreground">
          Evalúa y clasifica iniciativas según impacto, factibilidad y esfuerzo
        </p>
      </div>
      <PrioritizationMatrix caseId={caseId} />
    </div>
  );
}
