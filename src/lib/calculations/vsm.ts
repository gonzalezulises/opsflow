export interface ProcessStep {
  processTimeMinutes: number;
  waitTimeHours: number;
  reworkPercentage: number;
  addsValue: boolean;
}

export interface VSMResult {
  leadTimeHours: number;
  leadTimeDays: number;
  totalProcessTimeMinutes: number;
  totalProcessTimeHours: number;
  totalWaitTimeHours: number;
  valueAddTimeMinutes: number;
  valueAddTimeHours: number;
  nonValueAddTimeMinutes: number;
  flowEfficiency: number;
  avgRework: number;
  stepsCount: number;
  valueAddStepsCount: number;
}

/**
 * lean_correct_mode (default):
 * - Value time = sum of process time ONLY for steps where addsValue = true
 * - Flow efficiency = value time / lead time
 *
 * compatibility_mode:
 * - Value time = sum of ALL process times (replicates Excel behavior)
 * - Flow efficiency = total process time / lead time
 */
export function calculateVSM(
  steps: ProcessStep[],
  mode: "lean_correct" | "compatibility" = "lean_correct"
): VSMResult {
  const totalProcessTimeMinutes = steps.reduce(
    (sum, s) => sum + s.processTimeMinutes,
    0
  );
  const totalWaitTimeHours = steps.reduce(
    (sum, s) => sum + s.waitTimeHours,
    0
  );
  const totalProcessTimeHours = totalProcessTimeMinutes / 60;

  // Lead time = process time (converted to hours) + wait time
  const leadTimeHours = totalProcessTimeHours + totalWaitTimeHours;
  const leadTimeDays = leadTimeHours / 24;

  // Value-add time depends on mode
  const valueAddTimeMinutes =
    mode === "lean_correct"
      ? steps
          .filter((s) => s.addsValue)
          .reduce((sum, s) => sum + s.processTimeMinutes, 0)
      : totalProcessTimeMinutes;

  const valueAddTimeHours = valueAddTimeMinutes / 60;

  const nonValueAddTimeMinutes = totalProcessTimeMinutes - (
    mode === "lean_correct"
      ? valueAddTimeMinutes
      : 0
  );

  // Flow efficiency
  const flowEfficiency =
    leadTimeHours > 0 ? (valueAddTimeHours / leadTimeHours) * 100 : 0;

  // Average rework
  const avgRework =
    steps.length > 0
      ? steps.reduce((sum, s) => sum + s.reworkPercentage, 0) / steps.length
      : 0;

  const valueAddStepsCount = steps.filter((s) => s.addsValue).length;

  return {
    leadTimeHours: round(leadTimeHours),
    leadTimeDays: round(leadTimeDays),
    totalProcessTimeMinutes: round(totalProcessTimeMinutes),
    totalProcessTimeHours: round(totalProcessTimeHours),
    totalWaitTimeHours: round(totalWaitTimeHours),
    valueAddTimeMinutes: round(valueAddTimeMinutes),
    valueAddTimeHours: round(valueAddTimeHours),
    nonValueAddTimeMinutes: round(nonValueAddTimeMinutes),
    flowEfficiency: round(flowEfficiency),
    avgRework: round(avgRework),
    stepsCount: steps.length,
    valueAddStepsCount,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// VSM Comparison (Current vs Future)
// ---------------------------------------------------------------------------

export interface VSMMetricDelta {
  label: string;
  current: number;
  future: number;
  delta: number;
  deltaPct: number;
  unit: string;
  improved: boolean;
}

export interface VSMComparison {
  metrics: VSMMetricDelta[];
  summary: {
    leadTimeReduction: number;
    leadTimeReductionPct: number;
    efficiencyGain: number;
    stepsRemoved: number;
    reworkReduction: number;
  };
}

export function compareVSM(current: VSMResult, future: VSMResult): VSMComparison {
  function delta(cur: number, fut: number, lowerIsBetter: boolean): Pick<VSMMetricDelta, "delta" | "deltaPct" | "improved"> {
    const d = fut - cur;
    const pct = cur !== 0 ? (d / cur) * 100 : 0;
    return {
      delta: round(d),
      deltaPct: round(pct),
      improved: lowerIsBetter ? d < 0 : d > 0,
    };
  }

  const metrics: VSMMetricDelta[] = [
    { label: "Lead time", unit: "horas", current: current.leadTimeHours, future: future.leadTimeHours, ...delta(current.leadTimeHours, future.leadTimeHours, true) },
    { label: "Tiempo de proceso", unit: "min", current: current.totalProcessTimeMinutes, future: future.totalProcessTimeMinutes, ...delta(current.totalProcessTimeMinutes, future.totalProcessTimeMinutes, true) },
    { label: "Tiempo de espera", unit: "horas", current: current.totalWaitTimeHours, future: future.totalWaitTimeHours, ...delta(current.totalWaitTimeHours, future.totalWaitTimeHours, true) },
    { label: "Eficiencia de flujo", unit: "%", current: current.flowEfficiency, future: future.flowEfficiency, ...delta(current.flowEfficiency, future.flowEfficiency, false) },
    { label: "Retrabajo promedio", unit: "%", current: current.avgRework, future: future.avgRework, ...delta(current.avgRework, future.avgRework, true) },
    { label: "Cantidad de pasos", unit: "", current: current.stepsCount, future: future.stepsCount, ...delta(current.stepsCount, future.stepsCount, true) },
  ];

  return {
    metrics,
    summary: {
      leadTimeReduction: round(current.leadTimeHours - future.leadTimeHours),
      leadTimeReductionPct: current.leadTimeHours > 0
        ? round(((current.leadTimeHours - future.leadTimeHours) / current.leadTimeHours) * 100)
        : 0,
      efficiencyGain: round(future.flowEfficiency - current.flowEfficiency),
      stepsRemoved: current.stepsCount - future.stepsCount,
      reworkReduction: round(current.avgRework - future.avgRework),
    },
  };
}
