export interface PrioritizationWeights {
  impactLeadTime: number;
  impactEconomic: number;
  impactResilience: number;
  feasibility30d: number;
  effort: number;
  externalDependency: number;
}

export const DEFAULT_WEIGHTS: PrioritizationWeights = {
  impactLeadTime: 0.25,
  impactEconomic: 0.25,
  impactResilience: 0.20,
  feasibility30d: 0.20,
  effort: 0.05,
  externalDependency: 0.05,
};

export interface InitiativeScores {
  impactLeadTime: number; // 1-5
  impactEconomic: number; // 1-5
  impactResilience: number; // 1-5
  feasibility30d: number; // 1-5
  effort: number; // 1-5 (inverted: lower effort = better)
  externalDependency: number; // 1-5 (inverted: lower dep = better)
}

export type Classification = "Atacar ya" | "Diseñar" | "Postergar";

export interface PrioritizationResult {
  totalScore: number;
  classification: Classification;
}

export function calculatePrioritizationScore(
  scores: InitiativeScores,
  weights: PrioritizationWeights = DEFAULT_WEIGHTS
): PrioritizationResult {
  const totalScore =
    scores.impactLeadTime * weights.impactLeadTime +
    scores.impactEconomic * weights.impactEconomic +
    scores.impactResilience * weights.impactResilience +
    scores.feasibility30d * weights.feasibility30d +
    (6 - scores.effort) * weights.effort +
    (6 - scores.externalDependency) * weights.externalDependency;

  const rounded = Math.round(totalScore * 100) / 100;

  let classification: Classification;
  if (rounded >= 4.0) classification = "Atacar ya";
  else if (rounded >= 3.2) classification = "Diseñar";
  else classification = "Postergar";

  return { totalScore: rounded, classification };
}

export function getClassificationColor(c: Classification): string {
  switch (c) {
    case "Atacar ya": return "success";
    case "Diseñar": return "warning";
    case "Postergar": return "muted";
  }
}
