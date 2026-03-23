import { DiagnosticForm } from "@/features/diagnostic/components/diagnostic-form";

export default async function DiagnosticPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Diagnóstico de madurez</h2>
        <p className="text-sm text-muted-foreground">
          Evalúa el nivel de madurez operativa respondiendo 15 preguntas
          agrupadas por categoría
        </p>
      </div>
      <DiagnosticForm caseId={caseId} />
    </div>
  );
}
