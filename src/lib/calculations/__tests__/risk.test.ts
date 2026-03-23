import { describe, it, expect } from "vitest";
import {
  calculateExposure,
  rankRisks,
  getRiskLevel,
  getRiskLevelLabel,
} from "@/lib/calculations/risk";

describe("calculateExposure", () => {
  it("returns probability * impact", () => {
    expect(calculateExposure(3, 4)).toBe(12);
    expect(calculateExposure(5, 5)).toBe(25);
    expect(calculateExposure(1, 1)).toBe(1);
  });
});

describe("getRiskLevel", () => {
  it("returns 'critical' for exposure >= 20", () => {
    expect(getRiskLevel(20)).toBe("critical");
    expect(getRiskLevel(25)).toBe("critical");
  });

  it("returns 'high' for exposure >= 12 and < 20", () => {
    expect(getRiskLevel(12)).toBe("high");
    expect(getRiskLevel(19)).toBe("high");
  });

  it("returns 'medium' for exposure >= 6 and < 12", () => {
    expect(getRiskLevel(6)).toBe("medium");
    expect(getRiskLevel(11)).toBe("medium");
  });

  it("returns 'low' for exposure < 6", () => {
    expect(getRiskLevel(5)).toBe("low");
    expect(getRiskLevel(1)).toBe("low");
  });
});

describe("rankRisks", () => {
  it("ranks risks by exposure descending", () => {
    const risks = [
      { name: "A", probability: 2, impact: 3 },
      { name: "B", probability: 5, impact: 4 },
      { name: "C", probability: 3, impact: 3 },
    ];

    const ranked = rankRisks(risks);
    expect(ranked[0].name).toBe("B");
    expect(ranked[0].exposure).toBe(20);
    expect(ranked[0].rank).toBe(1);

    expect(ranked[1].name).toBe("C");
    expect(ranked[1].exposure).toBe(9);
    expect(ranked[1].rank).toBe(2);

    expect(ranked[2].name).toBe("A");
    expect(ranked[2].exposure).toBe(6);
    expect(ranked[2].rank).toBe(3);
  });

  it("breaks ties by impact then probability", () => {
    const risks = [
      { name: "X", probability: 3, impact: 2 }, // exposure 6
      { name: "Y", probability: 2, impact: 3 }, // exposure 6
    ];

    const ranked = rankRisks(risks);
    // Same exposure=6, Y has higher impact(3) so ranks first
    expect(ranked[0].name).toBe("Y");
    expect(ranked[1].name).toBe("X");
  });

  it("returns empty array for empty input", () => {
    expect(rankRisks([])).toEqual([]);
  });
});

describe("getRiskLevelLabel", () => {
  it("returns Spanish labels", () => {
    expect(getRiskLevelLabel("critical")).toBe("Crítico");
    expect(getRiskLevelLabel("high")).toBe("Alto");
    expect(getRiskLevelLabel("medium")).toBe("Medio");
    expect(getRiskLevelLabel("low")).toBe("Bajo");
  });
});
