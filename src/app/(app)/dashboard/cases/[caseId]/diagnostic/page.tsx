import { DiagnosticForm } from "@/features/diagnostic/components/diagnostic-form";
import {
  getDiagnosticQuestions,
  getDiagnosticResponses,
} from "@/server/actions/diagnostic";

export default async function DiagnosticPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  const [questionsResult, responsesResult] = await Promise.all([
    getDiagnosticQuestions(caseId),
    getDiagnosticResponses(caseId),
  ]);

  const questions = questionsResult.data ?? [];
  const responses = responsesResult.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Diagnóstico de madurez</h2>
        <p className="text-sm text-muted-foreground">
          Evalúa el nivel de madurez operativa respondiendo 15 preguntas
          agrupadas por categoría
        </p>
      </div>
      <DiagnosticForm
        caseId={caseId}
        questions={questions}
        initialResponses={responses}
      />
    </div>
  );
}
