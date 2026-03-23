import { CaseContextForm } from "@/features/cases/components/case-context-form";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Contexto del caso</h2>
        <p className="text-sm text-muted-foreground">
          Datos generales de la empresa, sector, proceso y métricas base
        </p>
      </div>
      <CaseContextForm caseId={caseId} />
    </div>
  );
}
