import { DiagnosticForm } from "@/features/diagnostic/components/diagnostic-form";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";
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
    <ModulePage guide={MODULE_GUIDES.diagnostic}>
      <DiagnosticForm
        caseId={caseId}
        questions={questions}
        initialResponses={responses}
      />
    </ModulePage>
  );
}
