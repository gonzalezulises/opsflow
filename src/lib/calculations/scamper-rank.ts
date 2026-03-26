/**
 * Rank and filter SCAMPER ideas — pure function, no AI.
 *
 * Removes duplicates, flags generic ideas, and sorts by a simple
 * composite score: impact × specificity.
 */

export interface ScamperIdea {
  category: "Sustituir" | "Combinar" | "Adaptar" | "Modificar" | "Poner otro uso" | "Eliminar" | "Revertir";
  title: string;
  description: string;
  affectedSteps: string[];
  improvementType: "tiempo" | "costo" | "calidad" | "flujo";
  estimatedImpact: "alto" | "medio" | "bajo";
}

export interface RankedIdea extends ScamperIdea {
  score: number;
  filtered: boolean;
  filterReason?: string;
}

const IMPACT_WEIGHT: Record<string, number> = {
  alto: 3,
  medio: 2,
  bajo: 1,
};

// Phrases that indicate a generic, non-specific idea
const GENERIC_PATTERNS = [
  /mejorar\s+(el|la|los|las)\s+proceso/i,
  /optimizar\s+(el|la|los|las)\s+(flujo|proceso|gestión)/i,
  /implementar\s+mejoras/i,
  /revisar\s+(el|la|los|las)\s+proceso/i,
  /evaluar\s+alternativas/i,
  /considerar\s+opciones/i,
];

function isGeneric(idea: ScamperIdea): boolean {
  // No affected steps = likely generic
  if (idea.affectedSteps.length === 0) return true;

  // Short description with no specifics
  if (idea.description.length < 30) return true;

  // Matches known generic patterns
  for (const pattern of GENERIC_PATTERNS) {
    if (pattern.test(idea.title) && idea.affectedSteps.length <= 1) return true;
  }

  return false;
}

function isDuplicate(idea: ScamperIdea, others: ScamperIdea[]): boolean {
  const normalizedTitle = idea.title.toLowerCase().trim();

  for (const other of others) {
    if (other === idea) continue;
    const otherTitle = other.title.toLowerCase().trim();

    // Exact title match
    if (normalizedTitle === otherTitle) return true;

    // High overlap in affected steps + same improvement type
    if (
      idea.improvementType === other.improvementType &&
      idea.affectedSteps.length > 0 &&
      other.affectedSteps.length > 0
    ) {
      const overlap = idea.affectedSteps.filter((s) =>
        other.affectedSteps.includes(s)
      );
      if (
        overlap.length >= Math.min(idea.affectedSteps.length, other.affectedSteps.length) &&
        overlap.length >= 2
      ) {
        return true;
      }
    }
  }

  return false;
}

export function rankScamperIdeas(ideas: ScamperIdea[]): RankedIdea[] {
  const ranked: RankedIdea[] = [];
  const seen = new Set<string>();

  for (const idea of ideas) {
    const key = idea.title.toLowerCase().trim();

    // Duplicate by title
    if (seen.has(key)) {
      ranked.push({ ...idea, score: 0, filtered: true, filterReason: "Duplicada" });
      continue;
    }
    seen.add(key);

    // Duplicate by content overlap
    if (isDuplicate(idea, ideas)) {
      // Keep the first occurrence, mark later ones
      const existingIdx = ranked.findIndex(
        (r) => !r.filtered && r.improvementType === idea.improvementType &&
          r.affectedSteps.some((s) => idea.affectedSteps.includes(s))
      );
      if (existingIdx >= 0) {
        ranked.push({ ...idea, score: 0, filtered: true, filterReason: "Similar a otra idea" });
        continue;
      }
    }

    // Generic check
    if (isGeneric(idea)) {
      ranked.push({ ...idea, score: 0, filtered: true, filterReason: "Demasiado genérica" });
      continue;
    }

    // Composite score: impact × specificity
    const impactScore = IMPACT_WEIGHT[idea.estimatedImpact] ?? 1;
    const specificityScore = Math.min(idea.affectedSteps.length, 3); // 1-3 points
    const descriptionScore = idea.description.length > 80 ? 2 : 1; // longer = more thought out
    const score = impactScore * (specificityScore + descriptionScore);

    ranked.push({ ...idea, score, filtered: false });
  }

  // Sort: non-filtered first by score desc, then filtered at the end
  return ranked.sort((a, b) => {
    if (a.filtered !== b.filtered) return a.filtered ? 1 : -1;
    return b.score - a.score;
  });
}
