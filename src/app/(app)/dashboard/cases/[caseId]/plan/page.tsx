import { ActionPlanTable } from "@/features/plan/components/action-plan-table";
import { getActionItems } from "@/server/actions/plan";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const { data: actions } = await getActionItems(caseId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Plan de 30 días</h2>
        <p className="text-sm text-muted-foreground">
          Acciones concretas, responsables, métricas y contingencias
        </p>
      </div>
      <ActionPlanTable caseId={caseId} initialActions={actions ?? []} />
    </div>
  );
}
