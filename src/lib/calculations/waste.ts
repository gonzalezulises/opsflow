const WEEKS_PER_MONTH = 4.33;

export interface WasteInput {
  frequencyPerWeek: number;
  minutesLostPerEvent: number;
  hourlyLaborCost: number;
  unitsAffected?: number;
  unitMargin?: number;
}

export interface WasteResult {
  laborCostMonthly: number;
  marginLostMonthly: number;
  totalCostMonthly: number;
}

export function calculateWasteCost(input: WasteInput): WasteResult {
  const laborCostMonthly =
    (input.frequencyPerWeek * input.minutesLostPerEvent) / 60 *
    input.hourlyLaborCost *
    WEEKS_PER_MONTH;

  const marginLostMonthly =
    (input.unitsAffected ?? 0) *
    (input.unitMargin ?? 0) *
    input.frequencyPerWeek *
    WEEKS_PER_MONTH;

  const totalCostMonthly = laborCostMonthly + marginLostMonthly;

  return {
    laborCostMonthly: round(laborCostMonthly),
    marginLostMonthly: round(marginLostMonthly),
    totalCostMonthly: round(totalCostMonthly),
  };
}

export function rankWasteItems<T extends { totalCostMonthly: number }>(
  items: T[]
): (T & { rank: number })[] {
  return [...items]
    .sort((a, b) => b.totalCostMonthly - a.totalCostMonthly)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
