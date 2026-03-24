"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DiagnosticSummary } from "./diagnostic-summary";
import { saveBulkDiagnosticResponses } from "@/server/actions/diagnostic";

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
  };

  const handleCommentChange = (questionId: string, value: string) => {
    setComments((prev) => ({ ...prev, [questionId]: value }));
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

    startTransition(async () => {
      const result = await saveBulkDiagnosticResponses({ caseId, responses });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Diagnóstico guardado");
      }
    });
  };

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

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar diagnóstico"}
          </Button>
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <DiagnosticSummary scores={allScores} />
        </div>
      </div>
    </div>
  );
}
