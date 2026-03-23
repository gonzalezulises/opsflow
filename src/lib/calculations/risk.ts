export interface RiskItem {
  probability: number; // 1-5
  impact: number; // 1-5
}

export interface RiskCalculation {
  exposure: number;
}

export function calculateExposure(probability: number, impact: number): number {
  return probability * impact;
}

export function rankRisks<T extends RiskItem>(items: T[]): (T & { exposure: number; rank: number })[] {
  return items
    .map((item) => ({
      ...item,
      exposure: calculateExposure(item.probability, item.impact),
    }))
    .sort((a, b) => {
      if (b.exposure !== a.exposure) return b.exposure - a.exposure;
      if (b.impact !== a.impact) return b.impact - a.impact;
      return b.probability - a.probability;
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function getRiskLevel(exposure: number): "critical" | "high" | "medium" | "low" {
  if (exposure >= 20) return "critical";
  if (exposure >= 12) return "high";
  if (exposure >= 6) return "medium";
  return "low";
}

export function getRiskLevelLabel(level: ReturnType<typeof getRiskLevel>): string {
  switch (level) {
    case "critical": return "Crítico";
    case "high": return "Alto";
    case "medium": return "Medio";
    case "low": return "Bajo";
  }
}
