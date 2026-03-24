import { WeeklyTracking } from "@/features/tracking/components/weekly-tracking";
import { ModulePage } from "@/components/shared/module-page";
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
    <ModulePage guide={MODULE_GUIDES.tracking}>
      <WeeklyTracking caseId={caseId} initialMetrics={metrics ?? []} />
    </ModulePage>
  );
}
