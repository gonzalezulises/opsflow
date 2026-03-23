import {
  calculateDiagnostic,
  getLevelColor,
  getLevelLabel,
} from "@/lib/calculations/diagnostic";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DiagnosticSummaryProps {
  scores: number[];
}

export function DiagnosticSummary({ scores }: DiagnosticSummaryProps) {
  const result = calculateDiagnostic(scores);
  const percentage = (result.average / 5) * 100;
  const variant = getLevelColor(result.level) as
    | "default"
    | "destructive"
    | "secondary";

  const barColor =
    result.level === "bajo"
      ? "bg-destructive"
      : result.level === "medio"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resultado del diagnóstico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Nivel de madurez
          </span>
          <Badge variant={variant}>{getLevelLabel(result.level)}</Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Promedio</span>
            <span className="font-medium">{result.average} / 5</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Puntaje total</span>
          <span className="font-medium">
            {result.total} / {result.maxPossible}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Preguntas respondidas</span>
          <span className="font-medium">
            {result.respondedCount} / {scores.length}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
