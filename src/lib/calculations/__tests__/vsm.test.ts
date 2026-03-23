import { describe, it, expect } from "vitest";
import { calculateVSM, type ProcessStep } from "@/lib/calculations/vsm";

const baseSteps: ProcessStep[] = [
  { processTimeMinutes: 12, waitTimeHours: 4, reworkPercentage: 18, addsValue: false },
  { processTimeMinutes: 15, waitTimeHours: 8, reworkPercentage: 11, addsValue: false },
  { processTimeMinutes: 20, waitTimeHours: 10, reworkPercentage: 7, addsValue: false },
  { processTimeMinutes: 75, waitTimeHours: 18, reworkPercentage: 9, addsValue: true },
  { processTimeMinutes: 18, waitTimeHours: 6, reworkPercentage: 3, addsValue: false },
  { processTimeMinutes: 12, waitTimeHours: 8, reworkPercentage: 4, addsValue: true },
];

describe("calculateVSM", () => {
  it("calculates correctly in lean_correct mode (base case)", () => {
    const result = calculateVSM(baseSteps, "lean_correct");

    // totalProcessTimeMinutes = 12+15+20+75+18+12 = 152
    expect(result.totalProcessTimeMinutes).toBe(152);
    expect(result.totalProcessTimeHours).toBeCloseTo(152 / 60, 2);

    // totalWaitTimeHours = 4+8+10+18+6+8 = 54
    expect(result.totalWaitTimeHours).toBe(54);

    // leadTimeHours = 152/60 + 54 = 2.5333 + 54 = 56.5333
    expect(result.leadTimeHours).toBeCloseTo(56.53, 1);

    // valueAddTimeMinutes (addsValue=true): 75 + 12 = 87
    expect(result.valueAddTimeMinutes).toBe(87);
    expect(result.valueAddTimeHours).toBeCloseTo(87 / 60, 2);

    // flowEfficiency = (87/60) / 56.5333 * 100 = 1.45 / 56.5333 * 100 ≈ 2.56%
    expect(result.flowEfficiency).toBeCloseTo(2.56, 1);

    // nonValueAddTimeMinutes = 152 - 87 = 65
    expect(result.nonValueAddTimeMinutes).toBe(65);

    // avgRework = (18+11+7+9+3+4)/6 = 52/6 ≈ 8.67
    expect(result.avgRework).toBeCloseTo(8.67, 1);

    expect(result.stepsCount).toBe(6);
    expect(result.valueAddStepsCount).toBe(2);
  });

  it("calculates correctly in compatibility mode (all process time is value)", () => {
    const result = calculateVSM(baseSteps, "compatibility");

    // In compatibility mode, valueAddTimeMinutes = totalProcessTimeMinutes = 152
    expect(result.valueAddTimeMinutes).toBe(152);
    expect(result.valueAddTimeHours).toBeCloseTo(152 / 60, 2);

    // nonValueAddTimeMinutes = 152 - 0 = 152 (in compat mode subtracted value is 0)
    // Actually: nonValueAdd = totalProcess - (mode=compat ? 0 : valueAdd) = 152 - 0 = 152
    expect(result.nonValueAddTimeMinutes).toBe(152);

    // flowEfficiency = (152/60) / 56.5333 * 100 ≈ 4.48%
    expect(result.flowEfficiency).toBeCloseTo(4.48, 1);

    // leadTime is the same regardless of mode
    expect(result.leadTimeHours).toBeCloseTo(56.53, 1);
  });

  it("returns zeroes for empty steps", () => {
    const result = calculateVSM([]);
    expect(result.leadTimeHours).toBe(0);
    expect(result.flowEfficiency).toBe(0);
    expect(result.totalProcessTimeMinutes).toBe(0);
    expect(result.totalWaitTimeHours).toBe(0);
    expect(result.avgRework).toBe(0);
    expect(result.stepsCount).toBe(0);
    expect(result.valueAddStepsCount).toBe(0);
  });

  it("handles a single step that adds value", () => {
    const step: ProcessStep = {
      processTimeMinutes: 60,
      waitTimeHours: 0,
      reworkPercentage: 5,
      addsValue: true,
    };
    const result = calculateVSM([step]);

    expect(result.totalProcessTimeMinutes).toBe(60);
    expect(result.leadTimeHours).toBe(1);
    expect(result.valueAddTimeMinutes).toBe(60);
    // flowEfficiency = 1h / 1h * 100 = 100%
    expect(result.flowEfficiency).toBe(100);
    expect(result.stepsCount).toBe(1);
    expect(result.valueAddStepsCount).toBe(1);
  });
});
