export type MaturityLevel = "bajo" | "medio" | "alto";

export interface DiagnosticResult {
  total: number;
  average: number;
  level: MaturityLevel;
  respondedCount: number;
  maxPossible: number;
}

export function calculateDiagnostic(scores: number[]): DiagnosticResult {
  const validScores = scores.filter((s) => s >= 1 && s <= 5);
  const total = validScores.reduce((sum, s) => sum + s, 0);
  const average = validScores.length > 0 ? total / validScores.length : 0;

  let level: MaturityLevel;
  if (average < 2.5) level = "bajo";
  else if (average < 3.8) level = "medio";
  else level = "alto";

  return {
    total,
    average: Math.round(average * 100) / 100,
    level,
    respondedCount: validScores.length,
    maxPossible: validScores.length * 5,
  };
}

export function getLevelColor(level: MaturityLevel): string {
  switch (level) {
    case "bajo":
      return "destructive";
    case "medio":
      return "warning";
    case "alto":
      return "success";
  }
}

export function getLevelLabel(level: MaturityLevel): string {
  switch (level) {
    case "bajo":
      return "Bajo";
    case "medio":
      return "Medio";
    case "alto":
      return "Alto";
  }
}
