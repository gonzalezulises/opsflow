"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DiagnosticSummary } from "./diagnostic-summary";

interface DiagnosticFormProps {
  caseId: string;
}

type Category =
  | "Planificación"
  | "Ejecución"
  | "Control"
  | "Mejora"
  | "Contexto";

interface DiagnosticQuestion {
  id: number;
  category: Category;
  text: string;
}

const QUESTIONS: DiagnosticQuestion[] = [
  {
    id: 1,
    category: "Planificación",
    text: "¿Existe un plan de producción/operaciones documentado y actualizado?",
  },
  {
    id: 2,
    category: "Planificación",
    text: "¿Se utilizan datos históricos para la planificación de demanda?",
  },
  {
    id: 3,
    category: "Planificación",
    text: "¿Los objetivos operativos están alineados con la estrategia del negocio?",
  },
  {
    id: 4,
    category: "Ejecución",
    text: "¿Los procesos clave están estandarizados y documentados?",
  },
  {
    id: 5,
    category: "Ejecución",
    text: "¿El personal conoce y sigue los procedimientos operativos?",
  },
  {
    id: 6,
    category: "Ejecución",
    text: "¿Se cuenta con recursos adecuados para cumplir los compromisos de entrega?",
  },
  {
    id: 7,
    category: "Control",
    text: "¿Existen indicadores de desempeño (KPIs) definidos y medidos regularmente?",
  },
  {
    id: 8,
    category: "Control",
    text: "¿Se realizan auditorías o revisiones periódicas del proceso?",
  },
  {
    id: 9,
    category: "Control",
    text: "¿Hay mecanismos de alerta temprana ante desviaciones?",
  },
  {
    id: 10,
    category: "Mejora",
    text: "¿Se implementan acciones correctivas de forma sistemática?",
  },
  {
    id: 11,
    category: "Mejora",
    text: "¿Existe un proceso formal de mejora continua (Kaizen, PDCA, etc.)?",
  },
  {
    id: 12,
    category: "Mejora",
    text: "¿Se registran y analizan las lecciones aprendidas?",
  },
  {
    id: 13,
    category: "Contexto",
    text: "¿La cultura organizacional apoya la gestión por procesos?",
  },
  {
    id: 14,
    category: "Contexto",
    text: "¿Se cuenta con herramientas tecnológicas adecuadas para la operación?",
  },
  {
    id: 15,
    category: "Contexto",
    text: "¿Existe colaboración efectiva entre áreas funcionales?",
  },
];

const CATEGORIES: Category[] = [
  "Planificación",
  "Ejecución",
  "Control",
  "Mejora",
  "Contexto",
];

const SCALE_LABELS: Record<number, string> = {
  1: "Muy bajo",
  2: "Bajo",
  3: "Medio",
  4: "Alto",
  5: "Muy alto",
};

export function DiagnosticForm({ caseId }: DiagnosticFormProps) {
  const [scores, setScores] = useState<Record<number, number>>({});
  const [comments, setComments] = useState<Record<number, string>>({});

  const handleScoreChange = (questionId: number, value: string) => {
    setScores((prev) => ({ ...prev, [questionId]: Number(value) }));
  };

  const handleCommentChange = (questionId: number, value: string) => {
    setComments((prev) => ({ ...prev, [questionId]: value }));
  };

  const allScores = QUESTIONS.map((q) => scores[q.id] ?? 0);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {CATEGORIES.map((category) => {
          const categoryQuestions = QUESTIONS.filter(
            (q) => q.category === category
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
                      {question.id}. {question.text}
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
          <Button>Guardar diagnóstico</Button>
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
