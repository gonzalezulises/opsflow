"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2 } from "lucide-react";
import { DiagnosticSummary } from "./diagnostic-summary";
import { saveBulkDiagnosticResponses } from "@/server/actions/diagnostic";
import { getAIInsight } from "@/server/actions/ai";
import { SaveBar } from "@/components/shared/save-bar";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { DiagnosticSummary as DiagnosticSummaryType } from "@/server/ai/schemas";

interface DbQuestion {
  id: string;
  caseId: string;
  orderIndex: number;
  category: string | null;
  questionText: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

interface DbResponse {
  id: string;
  caseId: string;
  questionId: string;
  score: number;
  comment: string | null;
  respondedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

interface DiagnosticFormProps {
  caseId: string;
  questions: DbQuestion[];
  initialResponses: DbResponse[];
}

const SCALE_LABELS: Record<number, string> = {
  1: "Muy bajo",
  2: "Bajo",
  3: "Medio",
  4: "Alto",
  5: "Muy alto",
};

export function DiagnosticForm({
  caseId,
  questions,
  initialResponses,
}: DiagnosticFormProps) {
  const [isPending, startTransition] = useTransition();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { dirty, markDirty, markClean } = useUnsavedChanges();

  const initialScores: Record<string, number> = {};
  const initialComments: Record<string, string> = {};
  for (const r of initialResponses) {
    initialScores[r.questionId] = r.score;
    if (r.comment) initialComments[r.questionId] = r.comment;
  }

  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [comments, setComments] = useState<Record<string, string>>(initialComments);

  const handleScoreChange = (questionId: string, value: string) => {
    setScores((prev) => ({ ...prev, [questionId]: Number(value) }));
    markDirty();
  };

  const handleCommentChange = (questionId: string, value: string) => {
    setComments((prev) => ({ ...prev, [questionId]: value }));
    markDirty();
  };

  const handleSave = () => {
    const responses = questions
      .filter((q) => scores[q.id] !== undefined)
      .map((q) => ({
        questionId: q.id,
        score: scores[q.id],
        comment: comments[q.id] || undefined,
      }));

    if (responses.length === 0) {
      toast.error("Responde al menos una pregunta antes de guardar");
      return;
    }

    setSaveError(null);
    startTransition(async () => {
      const result = await saveBulkDiagnosticResponses({ caseId, responses });
      if (result.error) {
        setSaveError(result.error);
        toast.error(result.error);
      } else {
        markClean();
        setLastSaved(new Date());
        toast.success("Diagnóstico guardado");
      }
    });
  };

  const [aiResult, setAiResult] = useState<DiagnosticSummaryType | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleAIAnalysis() {
    const answered = questions.filter((q) => scores[q.id] !== undefined);
    if (answered.length < 5) {
      toast.error("Responde al menos 5 preguntas antes de solicitar análisis IA");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    const context = questions
      .map((q) => {
        const score = scores[q.id];
        const comment = comments[q.id];
        return `[${q.category}] ${q.questionText}: ${score !== undefined ? `${score}/5` : "sin responder"}${comment ? ` — "${comment}"` : ""}`;
      })
      .join("\n");

    const { data, error } = await getAIInsight("diagnostic_summary", context);
    setAiLoading(false);

    if (error) {
      setAiError(error);
    } else {
      setAiResult(data as DiagnosticSummaryType);
    }
  }

  const categories = [...new Set(questions.map((q) => q.category ?? "General"))];

  const allScores = questions.map((q) => scores[q.id] ?? 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {categories.map((category) => {
          const categoryQuestions = questions.filter(
            (q) => (q.category ?? "General") === category
          );

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-base">{category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {categoryQuestions.map((question) => (
                  <div key={question.id} className="space-y-3">
                    <Label className="text-sm font-normal leading-snug">
                      {question.orderIndex}. {question.questionText}
                    </Label>

                    <RadioGroup
                      className="flex flex-wrap gap-3"
                      value={
                        scores[question.id] !== undefined
                          ? String(scores[question.id])
                          : undefined
                      }
                      onValueChange={(value) =>
                        handleScoreChange(question.id, value as string)
                      }
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-center gap-1.5"
                        >
                          <RadioGroupItem value={String(value)} />
                          <span className="text-xs text-muted-foreground">
                            {value} - {SCALE_LABELS[value]}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>

                    <Textarea
                      placeholder="Comentario opcional..."
                      rows={2}
                      className="text-sm"
                      value={comments[question.id] ?? ""}
                      onChange={(e) =>
                        handleCommentChange(question.id, e.target.value)
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        <SaveBar dirty={dirty} saving={isPending} lastSaved={lastSaved} error={saveError} onSave={handleSave} label="Guardar diagnóstico" />
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-20 space-y-4">
          <DiagnosticSummary scores={allScores} />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4" />
                Análisis IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                La IA analiza tus respuestas con pensamiento crítico: detecta contradicciones, identifica focos críticos y sugiere quick wins.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAIAnalysis}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 size-4" />
                    Generar análisis
                  </>
                )}
              </Button>

              {aiError && (
                <p className="text-sm text-destructive">{aiError}</p>
              )}

              {aiResult && (
                <div className="space-y-4 pt-2">
                  <div>
                    <Badge variant="outline" className="mb-2">Evaluación general</Badge>
                    <p className="text-sm leading-relaxed">{aiResult.overallAssessment}</p>
                  </div>

                  <Separator />

                  {aiResult.criticalFindings.length > 0 && (
                    <div>
                      <Badge variant="destructive" className="mb-2">Hallazgos críticos</Badge>
                      <ul className="space-y-1 text-sm">
                        {aiResult.criticalFindings.map((f, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="shrink-0 text-destructive">•</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult.contradictions.length > 0 && (
                    <div>
                      <Badge variant="secondary" className="mb-2">Contradicciones detectadas</Badge>
                      <ul className="space-y-1 text-sm">
                        {aiResult.contradictions.map((c, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="shrink-0 text-amber-500">⚠</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult.focusAreas.length > 0 && (
                    <div>
                      <Badge className="mb-2">Áreas foco</Badge>
                      <ul className="space-y-1 text-sm">
                        {aiResult.focusAreas.map((a, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="shrink-0 text-primary">→</span>
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult.quickWins.length > 0 && (
                    <div>
                      <Badge variant="outline" className="mb-2">Quick wins</Badge>
                      <ul className="space-y-1 text-sm">
                        {aiResult.quickWins.map((w, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="shrink-0 text-green-600">✓</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
