import { VSMTable } from "@/features/vsm/components/vsm-table";

export default async function VSMPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Value Stream Map</h2>
        <p className="text-sm text-muted-foreground">
          Mapea los pasos del proceso, identifica tiempos de espera y calcula la
          eficiencia de flujo
        </p>
      </div>
      <VSMTable caseId={caseId} />
    </div>
  );
}
