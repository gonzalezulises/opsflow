import { notFound } from "next/navigation";
import { CaseContextForm } from "@/features/cases/components/case-context-form";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getCase } from "@/server/actions/cases";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const result = await getCase(caseId);

  if (result.error || !result.data) {
    notFound();
  }

  const row = result.data;

  return (
    <ModulePage guide={MODULE_GUIDES.context}>
      <CaseContextForm
        caseData={{
          id: row.id,
          name: row.name,
          companyName: row.companyName,
          sector: row.sector,
          processFocus: row.processFocus,
          currency: row.currency,
          locale: row.locale,
          status: row.status,
          metrics: row.metrics,
        }}
      />
    </ModulePage>
  );
}
