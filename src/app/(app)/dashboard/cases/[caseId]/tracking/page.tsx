import { WeeklyTracking } from "@/features/tracking/components/weekly-tracking";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Seguimiento semanal</h2>
        <p className="text-sm text-muted-foreground">
          Métricas semanales, tendencias y alertas de deterioro
        </p>
      </div>
      <WeeklyTracking caseId={caseId} />
    </div>
  );
}
