import { describe, it, expect } from "vitest";
import {
  calculateWasteCost,
  rankWasteItems,
} from "@/lib/calculations/waste";

const WEEKS_PER_MONTH = 4.33;

describe("calculateWasteCost", () => {
  it("calculates labor cost correctly", () => {
    const result = calculateWasteCost({
      frequencyPerWeek: 38,
      minutesLostPerEvent: 25,
      hourlyLaborCost: 8,
      unitsAffected: 0,
      unitMargin: 0,
    });

    // labor = (38 * 25) / 60 * 8 * 4.33
    const expected = (38 * 25) / 60 * 8 * WEEKS_PER_MONTH;
    expect(result.laborCostMonthly).toBeCloseTo(expected, 1);
    expect(result.marginLostMonthly).toBe(0);
    expect(result.totalCostMonthly).toBeCloseTo(expected, 1);
  });

  it("calculates margin lost correctly", () => {
    const result = calculateWasteCost({
      frequencyPerWeek: 10,
      minutesLostPerEvent: 0,
      hourlyLaborCost: 0,
      unitsAffected: 3,
      unitMargin: 50,
    });

    // margin = 3 * 50 * 10 * 4.33 = 6495
    const expected = 3 * 50 * 10 * WEEKS_PER_MONTH;
    expect(result.marginLostMonthly).toBeCloseTo(expected, 1);
    expect(result.laborCostMonthly).toBe(0);
  });

  it("calculates total cost as sum of labor and margin", () => {
    const result = calculateWasteCost({
      frequencyPerWeek: 20,
      minutesLostPerEvent: 15,
      hourlyLaborCost: 10,
      unitsAffected: 2,
      unitMargin: 30,
    });

    const labor = (20 * 15) / 60 * 10 * WEEKS_PER_MONTH;
    const margin = 2 * 30 * 20 * WEEKS_PER_MONTH;
    expect(result.totalCostMonthly).toBeCloseTo(labor + margin, 1);
  });

  it("handles missing unitsAffected and unitMargin", () => {
    const result = calculateWasteCost({
      frequencyPerWeek: 10,
      minutesLostPerEvent: 30,
      hourlyLaborCost: 12,
    });

    const labor = (10 * 30) / 60 * 12 * WEEKS_PER_MONTH;
    expect(result.laborCostMonthly).toBeCloseTo(labor, 1);
    expect(result.marginLostMonthly).toBe(0);
  });

  it("returns zero for all-zero inputs", () => {
    const result = calculateWasteCost({
      frequencyPerWeek: 0,
      minutesLostPerEvent: 0,
      hourlyLaborCost: 0,
    });

    expect(result.laborCostMonthly).toBe(0);
    expect(result.marginLostMonthly).toBe(0);
    expect(result.totalCostMonthly).toBe(0);
  });
});

describe("rankWasteItems", () => {
  it("ranks items by totalCostMonthly descending", () => {
    const items = [
      { name: "A", totalCostMonthly: 100 },
      { name: "B", totalCostMonthly: 500 },
      { name: "C", totalCostMonthly: 250 },
    ];

    const ranked = rankWasteItems(items);
    expect(ranked[0].name).toBe("B");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].name).toBe("C");
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].name).toBe("A");
    expect(ranked[2].rank).toBe(3);
  });

  it("returns empty array for empty input", () => {
    expect(rankWasteItems([])).toEqual([]);
  });
});
