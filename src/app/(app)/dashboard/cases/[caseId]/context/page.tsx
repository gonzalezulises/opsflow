import { notFound } from "next/navigation";
import { CaseContextForm } from "@/features/cases/components/case-context-form";
import { ModuleGuide } from "@/components/shared/module-guide";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Contexto del caso</h2>
        <p className="text-sm text-muted-foreground">
          Datos generales de la empresa, sector, proceso y métricas base
        </p>
      </div>
      <ModuleGuide content={MODULE_GUIDES.context} />
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
    </div>
  );
}
