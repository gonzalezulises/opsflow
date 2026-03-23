import { describe, it, expect } from "vitest";
import { detectTrends, compareToTarget } from "@/lib/calculations/tracking";
import type { WeeklyMetric } from "@/lib/calculations/tracking";

function makeMetric(overrides: Partial<WeeklyMetric> & { weekNumber: number }): WeeklyMetric {
  return {
    leadTime: 48,
    otdOtif: 85,
    pctOrdersCorrected: 10,
    pctOrdersRescheduled: 8,
    reworkPicking: 12,
    planProgress: 50,
    ...overrides,
  };
}

describe("detectTrends", () => {
  it("detects 3 weeks of deteriorating lead time (increasing)", () => {
    const metrics: WeeklyMetric[] = [
      makeMetric({ weekNumber: 1, leadTime: 40 }),
      makeMetric({ weekNumber: 2, leadTime: 45 }),
      makeMetric({ weekNumber: 3, leadTime: 50 }),
    ];

    const alerts = detectTrends(metrics);
    const leadTimeAlert = alerts.find((a) => a.metric === "leadTime");
    expect(leadTimeAlert).toBeDefined();
    expect(leadTimeAlert!.direction).toBe("deteriorating");
    expect(leadTimeAlert!.consecutiveWeeks).toBe(2);
    expect(leadTimeAlert!.currentValue).toBe(50);
    expect(leadTimeAlert!.previousValue).toBe(45);
  });

  it("detects deteriorating OTD/OTIF (decreasing)", () => {
    const metrics: WeeklyMetric[] = [
      makeMetric({ weekNumber: 1, otdOtif: 90 }),
      makeMetric({ weekNumber: 2, otdOtif: 85 }),
      makeMetric({ weekNumber: 3, otdOtif: 80 }),
    ];

    const alerts = detectTrends(metrics);
    const otdAlert = alerts.find((a) => a.metric === "otdOtif");
    expect(otdAlert).toBeDefined();
    expect(otdAlert!.direction).toBe("deteriorating");
    expect(otdAlert!.consecutiveWeeks).toBe(2);
  });

  it("returns no alerts for stable metrics", () => {
    const metrics: WeeklyMetric[] = [
      makeMetric({ weekNumber: 1 }),
      makeMetric({ weekNumber: 2 }),
      makeMetric({ weekNumber: 3 }),
    ];

    const alerts = detectTrends(metrics);
    expect(alerts).toHaveLength(0);
  });

  it("returns no alerts with only 1 week of data", () => {
    const alerts = detectTrends([makeMetric({ weekNumber: 1 })]);
    expect(alerts).toHaveLength(0);
  });

  it("returns empty array for empty input", () => {
    expect(detectTrends([])).toEqual([]);
  });

  it("does not alert when deterioration is only 1 week", () => {
    const metrics: WeeklyMetric[] = [
      makeMetric({ weekNumber: 1, leadTime: 40 }),
      makeMetric({ weekNumber: 2, leadTime: 45 }),
      makeMetric({ weekNumber: 3, leadTime: 42 }), // improved
    ];

    const alerts = detectTrends(metrics);
    const leadTimeAlert = alerts.find((a) => a.metric === "leadTime");
    expect(leadTimeAlert).toBeUndefined();
  });

  it("sorts by weekNumber regardless of input order", () => {
    const metrics: WeeklyMetric[] = [
      makeMetric({ weekNumber: 3, leadTime: 50 }),
      makeMetric({ weekNumber: 1, leadTime: 40 }),
      makeMetric({ weekNumber: 2, leadTime: 45 }),
    ];

    const alerts = detectTrends(metrics);
    const leadTimeAlert = alerts.find((a) => a.metric === "leadTime");
    expect(leadTimeAlert).toBeDefined();
    expect(leadTimeAlert!.currentValue).toBe(50);
  });
});

describe("compareToTarget", () => {
  it("compares current metrics to targets", () => {
    const current = makeMetric({
      weekNumber: 5,
      leadTime: 45,
      otdOtif: 90,
      planProgress: 60,
    });

    const results = compareToTarget(current, {
      leadTime: 48,
      otdOtif: 85,
      planProgress: 50,
    });

    expect(results).toHaveLength(3);

    const lt = results.find((r) => r.metric === "Lead Time");
    expect(lt!.onTrack).toBe(true); // 45 <= 48

    const otd = results.find((r) => r.metric === "OTD/OTIF");
    expect(otd!.onTrack).toBe(true); // 90 >= 85

    const plan = results.find((r) => r.metric === "Avance del plan");
    expect(plan!.onTrack).toBe(true); // 60 >= 50
  });

  it("marks metrics as not on track when exceeding thresholds", () => {
    const current = makeMetric({
      weekNumber: 5,
      leadTime: 55,
      otdOtif: 70,
    });

    const results = compareToTarget(current, {
      leadTime: 48,
      otdOtif: 85,
    });

    const lt = results.find((r) => r.metric === "Lead Time");
    expect(lt!.onTrack).toBe(false); // 55 > 48

    const otd = results.find((r) => r.metric === "OTD/OTIF");
    expect(otd!.onTrack).toBe(false); // 70 < 85
  });

  it("returns empty array when no targets provided", () => {
    const results = compareToTarget(makeMetric({ weekNumber: 1 }), {});
    expect(results).toHaveLength(0);
  });
});
