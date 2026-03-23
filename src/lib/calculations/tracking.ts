export interface WeeklyMetric {
  weekNumber: number;
  leadTime: number;
  otdOtif: number;
  pctOrdersCorrected: number;
  pctOrdersRescheduled: number;
  reworkPicking: number;
  planProgress: number;
}

export interface TrackingTarget {
  leadTime?: number;
  otdOtif?: number;
  pctOrdersCorrected?: number;
  pctOrdersRescheduled?: number;
  reworkPicking?: number;
  planProgress?: number;
}

export interface TrendAlert {
  metric: string;
  label: string;
  direction: "deteriorating" | "improving" | "stable";
  consecutiveWeeks: number;
  currentValue: number;
  previousValue: number;
}

/**
 * Detects 2+ consecutive weeks of deterioration in any metric.
 * "Deterioration" means moving away from the target direction:
 * - lead_time, corrected, rescheduled, rework: lower is better → increase = deterioration
 * - otd_otif, plan_progress: higher is better → decrease = deterioration
 */
export function detectTrends(metrics: WeeklyMetric[]): TrendAlert[] {
  if (metrics.length < 2) return [];

  const sorted = [...metrics].sort((a, b) => a.weekNumber - b.weekNumber);
  const alerts: TrendAlert[] = [];

  const checks: {
    key: keyof WeeklyMetric;
    label: string;
    higherIsBetter: boolean;
  }[] = [
    { key: "leadTime", label: "Lead Time", higherIsBetter: false },
    { key: "otdOtif", label: "OTD/OTIF", higherIsBetter: true },
    { key: "pctOrdersCorrected", label: "Pedidos corregidos", higherIsBetter: false },
    { key: "pctOrdersRescheduled", label: "Órdenes reprogramadas", higherIsBetter: false },
    { key: "reworkPicking", label: "Retrabajo picking", higherIsBetter: false },
    { key: "planProgress", label: "Avance del plan", higherIsBetter: true },
  ];

  for (const check of checks) {
    let consecutiveDeteriorating = 0;

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i][check.key] as number;
      const prev = sorted[i - 1][check.key] as number;

      const isDeteriorating = check.higherIsBetter
        ? curr < prev
        : curr > prev;

      if (isDeteriorating) {
        consecutiveDeteriorating++;
      } else {
        consecutiveDeteriorating = 0;
      }
    }

    if (consecutiveDeteriorating >= 2) {
      const last = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];
      alerts.push({
        metric: check.key,
        label: check.label,
        direction: "deteriorating",
        consecutiveWeeks: consecutiveDeteriorating,
        currentValue: last[check.key] as number,
        previousValue: prev[check.key] as number,
      });
    }
  }

  return alerts;
}

export function compareToTarget(
  current: WeeklyMetric,
  target: TrackingTarget
): { metric: string; current: number; target: number; onTrack: boolean }[] {
  const results: { metric: string; current: number; target: number; onTrack: boolean }[] = [];

  if (target.leadTime != null) {
    results.push({ metric: "Lead Time", current: current.leadTime, target: target.leadTime, onTrack: current.leadTime <= target.leadTime });
  }
  if (target.otdOtif != null) {
    results.push({ metric: "OTD/OTIF", current: current.otdOtif, target: target.otdOtif, onTrack: current.otdOtif >= target.otdOtif });
  }
  if (target.pctOrdersCorrected != null) {
    results.push({ metric: "Pedidos corregidos", current: current.pctOrdersCorrected, target: target.pctOrdersCorrected, onTrack: current.pctOrdersCorrected <= target.pctOrdersCorrected });
  }
  if (target.pctOrdersRescheduled != null) {
    results.push({ metric: "Órdenes reprogramadas", current: current.pctOrdersRescheduled, target: target.pctOrdersRescheduled, onTrack: current.pctOrdersRescheduled <= target.pctOrdersRescheduled });
  }
  if (target.reworkPicking != null) {
    results.push({ metric: "Retrabajo picking", current: current.reworkPicking, target: target.reworkPicking, onTrack: current.reworkPicking <= target.reworkPicking });
  }
  if (target.planProgress != null) {
    results.push({ metric: "Avance del plan", current: current.planProgress, target: target.planProgress, onTrack: current.planProgress >= target.planProgress });
  }

  return results;
}
