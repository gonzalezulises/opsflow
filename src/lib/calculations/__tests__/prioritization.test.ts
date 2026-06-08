import { describe, it, expect } from "vitest";
import {
  calculatePrioritizationScore,
  getClassificationColor,
} from "@/lib/calculations/prioritization";

describe("calculatePrioritizationScore", () => {
  it("classifies high scores as 'Atacar ya'", () => {
    const result = calculatePrioritizationScore({
      impactLeadTime: 4,
      impactEconomic: 4,
      impactResilience: 3,
      feasibility30d: 5,
      effort: 2,         // inverted: (6-2)=4
      externalDependency: 1, // inverted: (6-1)=5
    });

    // 4*0.25 + 4*0.25 + 3*0.20 + 5*0.20 + 4*0.05 + 5*0.05
    // = 1 + 1 + 0.6 + 1 + 0.2 + 0.25 = 4.05
    expect(result.totalScore).toBe(4.05);
    expect(result.classification).toBe("Atacar ya");
  });

  it("classifies all 1s as 'Postergar'", () => {
    const result = calculatePrioritizationScore({
      impactLeadTime: 1,
      impactEconomic: 1,
      impactResilience: 1,
      feasibility30d: 1,
      effort: 5,         // inverted: (6-5)=1
      externalDependency: 5, // inverted: (6-5)=1
    });

    // 1*0.25 + 1*0.25 + 1*0.20 + 1*0.20 + 1*0.05 + 1*0.05
    // = 0.25 + 0.25 + 0.20 + 0.20 + 0.05 + 0.05 = 1.0
    expect(result.totalScore).toBe(1);
    expect(result.classification).toBe("Postergar");
  });

  it("classifies score exactly 4.0 as 'Atacar ya'", () => {
    // Need: total = 4.0
    // 5*0.25 + 4*0.25 + 3*0.20 + 4*0.20 + (6-3)*0.05 + (6-3)*0.05
    // = 1.25 + 1 + 0.6 + 0.8 + 0.15 + 0.15 = 3.95 — not quite
    // Try: 5*0.25 + 4*0.25 + 4*0.20 + 3*0.20 + (6-2)*0.05 + (6-2)*0.05
    // = 1.25 + 1 + 0.8 + 0.6 + 0.2 + 0.2 = 4.05 — too high
    // Direct approach: craft scores that sum to exactly 4.0
    // 4*0.25 + 4*0.25 + 4*0.20 + 4*0.20 + (6-2)*0.05 + (6-2)*0.05
    // = 1 + 1 + 0.8 + 0.8 + 0.2 + 0.2 = 4.0
    const result = calculatePrioritizationScore({
      impactLeadTime: 4,
      impactEconomic: 4,
      impactResilience: 4,
      feasibility30d: 4,
      effort: 2,
      externalDependency: 2,
    });

    expect(result.totalScore).toBe(4);
    expect(result.classification).toBe("Atacar ya");
  });

  it("classifies score exactly 3.2 as 'Diseñar'", () => {
    // 3*0.25 + 3*0.25 + 3*0.20 + 3*0.20 + (6-3)*0.05 + (6-1)*0.05
    // = 0.75 + 0.75 + 0.6 + 0.6 + 0.15 + 0.25 = 3.1 — not enough
    // 4*0.25 + 3*0.25 + 3*0.20 + 3*0.20 + (6-3)*0.05 + (6-3)*0.05
    // = 1 + 0.75 + 0.6 + 0.6 + 0.15 + 0.15 = 3.25 — close
    // 3*0.25 + 3*0.25 + 4*0.20 + 3*0.20 + (6-2)*0.05 + (6-2)*0.05
    // = 0.75 + 0.75 + 0.8 + 0.6 + 0.2 + 0.2 = 3.3 — hmm
    // Use custom weights or accept close values. Let me compute for 3.2:
    // 3*0.25 + 3*0.25 + 3*0.20 + 4*0.20 + (6-2)*0.05 + (6-2)*0.05
    // = 0.75 + 0.75 + 0.6 + 0.8 + 0.2 + 0.2 = 3.3
    // 3*0.25 + 3*0.25 + 3*0.20 + 3*0.20 + (6-1)*0.05 + (6-1)*0.05
    // = 0.75 + 0.75 + 0.6 + 0.6 + 0.25 + 0.25 = 3.2
    const result = calculatePrioritizationScore({
      impactLeadTime: 3,
      impactEconomic: 3,
      impactResilience: 3,
      feasibility30d: 3,
      effort: 1,
      externalDependency: 1,
    });

    expect(result.totalScore).toBe(3.2);
    expect(result.classification).toBe("Diseñar");
  });

  it("classifies score just below 3.2 as 'Postergar'", () => {
    // 3*0.25 + 3*0.25 + 3*0.20 + 3*0.20 + (6-2)*0.05 + (6-1)*0.05
    // = 0.75 + 0.75 + 0.6 + 0.6 + 0.2 + 0.25 = 3.15
    const result = calculatePrioritizationScore({
      impactLeadTime: 3,
      impactEconomic: 3,
      impactResilience: 3,
      feasibility30d: 3,
      effort: 2,
      externalDependency: 1,
    });

    expect(result.totalScore).toBe(3.15);
    expect(result.classification).toBe("Postergar");
  });

  it("accepts custom weights", () => {
    const result = calculatePrioritizationScore(
      {
        impactLeadTime: 5,
        impactEconomic: 1,
        impactResilience: 1,
        feasibility30d: 1,
        effort: 5,
        externalDependency: 5,
      },
      {
        impactLeadTime: 1.0,
        impactEconomic: 0,
        impactResilience: 0,
        feasibility30d: 0,
        effort: 0,
        externalDependency: 0,
      }
    );

    expect(result.totalScore).toBe(5);
    expect(result.classification).toBe("Atacar ya");
  });
});

describe("getClassificationColor", () => {
  it("returns correct colors", () => {
    expect(getClassificationColor("Atacar ya")).toBe("success");
    expect(getClassificationColor("Diseñar")).toBe("warning");
    expect(getClassificationColor("Postergar")).toBe("muted");
  });
});
