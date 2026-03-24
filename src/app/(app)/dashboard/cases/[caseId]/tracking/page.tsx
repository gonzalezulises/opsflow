import { WeeklyTracking } from "@/features/tracking/components/weekly-tracking";
import { ModuleGuide } from "@/components/shared/module-guide";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getWeeklyMetrics } from "@/server/actions/tracking";

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const { data: metrics } = await getWeeklyMetrics(caseId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Seguimiento semanal</h2>
        <p className="text-sm text-muted-foreground">
          Métricas semanales, tendencias y alertas de deterioro
        </p>
      </div>
      <ModuleGuide content={MODULE_GUIDES.tracking} />
      <WeeklyTracking caseId={caseId} initialMetrics={metrics ?? []} />
    </div>
  );
}
