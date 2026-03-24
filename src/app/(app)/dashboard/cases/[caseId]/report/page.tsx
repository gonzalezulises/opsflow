import { ExecutiveReport } from "@/features/reports/components/executive-report";
import { ModuleGuide } from "@/components/shared/module-guide";
import { MODULE_GUIDES } from "@/lib/constants/guides";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Reporte ejecutivo</h2>
        <p className="text-sm text-muted-foreground">
          Resumen consolidado del caso con todos los hallazgos y recomendaciones
        </p>
      </div>
      <ModuleGuide content={MODULE_GUIDES.report} />
      <ExecutiveReport caseId={caseId} />
    </div>
  );
}
