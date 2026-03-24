import { ExecutiveReport } from "@/features/reports/components/executive-report";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <ModulePage guide={MODULE_GUIDES.report}>
      <ExecutiveReport caseId={caseId} />
    </ModulePage>
  );
}
