import { ActionPlanTable } from "@/features/plan/components/action-plan-table";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getActionItems } from "@/server/actions/plan";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const { data: actions } = await getActionItems(caseId);

  return (
    <ModulePage guide={MODULE_GUIDES.plan}>
      <ActionPlanTable caseId={caseId} initialActions={actions ?? []} />
    </ModulePage>
  );
}
