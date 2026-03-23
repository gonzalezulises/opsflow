import { describe, it, expect } from "vitest";
import {
  calculateDiagnostic,
  getLevelColor,
  getLevelLabel,
} from "@/lib/calculations/diagnostic";

describe("calculateDiagnostic", () => {
  it("returns zero average and 'bajo' for empty scores array", () => {
    const result = calculateDiagnostic([]);
    expect(result.total).toBe(0);
    expect(result.average).toBe(0);
    expect(result.level).toBe("bajo");
    expect(result.respondedCount).toBe(0);
    expect(result.maxPossible).toBe(0);
  });

  it("returns 'bajo' when all scores are 1", () => {
    const scores = Array(15).fill(1);
    const result = calculateDiagnostic(scores);
    expect(result.average).toBe(1);
    expect(result.level).toBe("bajo");
    expect(result.total).toBe(15);
    expect(result.respondedCount).toBe(15);
    expect(result.maxPossible).toBe(75);
  });

  it("returns 'medio' when all scores are 3", () => {
    const scores = Array(15).fill(3);
    const result = calculateDiagnostic(scores);
    expect(result.average).toBe(3);
    expect(result.level).toBe("medio");
  });

  it("returns 'alto' when all scores are 5", () => {
    const scores = Array(15).fill(5);
    const result = calculateDiagnostic(scores);
    expect(result.average).toBe(5);
    expect(result.level).toBe("alto");
  });

  it("returns 'medio' for mixed base case [3,2,3,2,3,2,3,2,3,3,2,3,3,2,3]", () => {
    const scores = [3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 2, 3, 3, 2, 3];
    const result = calculateDiagnostic(scores);
    // total = 39, average = 39/15 = 2.6
    expect(result.total).toBe(39);
    expect(result.average).toBe(2.6);
    expect(result.level).toBe("medio");
    expect(result.respondedCount).toBe(15);
  });

  it("filters out invalid scores (outside 1-5 range)", () => {
    const scores = [3, 0, 6, -1, 5, 100, 2];
    const result = calculateDiagnostic(scores);
    // valid: [3, 5, 2] => total=10, avg=3.33
    expect(result.respondedCount).toBe(3);
    expect(result.total).toBe(10);
    expect(result.average).toBe(3.33);
    expect(result.level).toBe("medio");
    expect(result.maxPossible).toBe(15);
  });

  it("classifies boundary at exactly 2.5 as 'medio'", () => {
    // average must be >= 2.5 for medio (< 2.5 is bajo)
    const scores = [2, 3]; // avg = 2.5
    const result = calculateDiagnostic(scores);
    expect(result.average).toBe(2.5);
    expect(result.level).toBe("medio");
  });

  it("classifies boundary at exactly 3.8 as 'alto'", () => {
    // average >= 3.8 is alto
    const scores = [4, 4, 4, 3, 4]; // avg = 19/5 = 3.8
    const result = calculateDiagnostic(scores);
    expect(result.average).toBe(3.8);
    expect(result.level).toBe("alto");
  });
});

describe("getLevelColor", () => {
  it("returns correct colors for each level", () => {
    expect(getLevelColor("bajo")).toBe("destructive");
    expect(getLevelColor("medio")).toBe("warning");
    expect(getLevelColor("alto")).toBe("success");
  });
});

describe("getLevelLabel", () => {
  it("returns correct labels for each level", () => {
    expect(getLevelLabel("bajo")).toBe("Bajo");
    expect(getLevelLabel("medio")).toBe("Medio");
    expect(getLevelLabel("alto")).toBe("Alto");
  });
});
