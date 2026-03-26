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
// Step-level diff (current step ↔ linked future step)
// ---------------------------------------------------------------------------

export interface StepDiff {
  name: string;
  futureName: string;
  renamed: boolean;
  removed: boolean;
  added: boolean;
  waitDelta: number;
  processDelta: number;
  reworkDelta: number;
  justification: string;
  linkedInitiativeIds: string[];
  impactScore: number; // abs sum of time deltas — higher = more impactful
}

interface RawStep {
  id: string;
  stepName: string;
  processTimeMinutes: number;
  waitTimeHours: number;
  reworkPercentage: number;
  sourceStepId: string | null;
  justification: string;
  linkedInitiativeIds: string[];
}

export function diffSteps(currentRaw: RawStep[], futureRaw: RawStep[]): StepDiff[] {
  const diffs: StepDiff[] = [];
  const matchedCurrentIds = new Set<string>();

  // Matched steps (future has sourceStepId pointing to current)
  for (const f of futureRaw) {
    if (!f.sourceStepId) {
      // New step added in future
      diffs.push({
        name: "(nuevo)",
        futureName: f.stepName,
        renamed: false,
        removed: false,
        added: true,
        waitDelta: 0,
        processDelta: 0,
        reworkDelta: 0,
        justification: f.justification,
        linkedInitiativeIds: f.linkedInitiativeIds,
        impactScore: f.waitTimeHours * 60 + f.processTimeMinutes,
      });
      continue;
    }

    const c = currentRaw.find((s) => s.id === f.sourceStepId);
    if (!c) continue;

    matchedCurrentIds.add(c.id);

    const waitDelta = round(f.waitTimeHours - c.waitTimeHours);
    const processDelta = round(f.processTimeMinutes - c.processTimeMinutes);
    const reworkDelta = round(f.reworkPercentage - c.reworkPercentage);

    diffs.push({
      name: c.stepName,
      futureName: f.stepName,
      renamed: c.stepName !== f.stepName,
      removed: false,
      added: false,
      waitDelta,
      processDelta,
      reworkDelta,
      justification: f.justification,
      linkedInitiativeIds: f.linkedInitiativeIds,
      impactScore: Math.abs(waitDelta * 60) + Math.abs(processDelta) + Math.abs(reworkDelta * 10),
    });
  }

  // Steps in current that were removed in future
  for (const c of currentRaw) {
    if (!matchedCurrentIds.has(c.id) && !futureRaw.some((f) => f.sourceStepId === c.id)) {
      diffs.push({
        name: c.stepName,
        futureName: "",
        renamed: false,
        removed: true,
        added: false,
        waitDelta: -c.waitTimeHours,
        processDelta: -c.processTimeMinutes,
        reworkDelta: -c.reworkPercentage,
        justification: "",
        linkedInitiativeIds: [],
        impactScore: c.waitTimeHours * 60 + c.processTimeMinutes,
      });
    }
  }

  return diffs.sort((a, b) => b.impactScore - a.impactScore);
}

// ---------------------------------------------------------------------------
// Narrative generation (pure, no AI)
// ---------------------------------------------------------------------------

export interface ImprovementNarrative {
  headline: string;
  bullets: string[];
  topChanges: { step: string; description: string; justification: string }[];
}

export function generateImprovementNarrative(
  comparison: VSMComparison,
  stepDiffs: StepDiff[],
): ImprovementNarrative {
  const { summary } = comparison;
  const fmt = (n: number) => Math.abs(n).toFixed(1);

  // Headline
  const parts: string[] = [];
  if (summary.leadTimeReduction > 0) {
    parts.push(`reduce el lead time en ${fmt(summary.leadTimeReduction)} horas (${fmt(summary.leadTimeReductionPct)}%)`);
  }
  if (summary.efficiencyGain > 0) {
    parts.push(`mejora la eficiencia de flujo en ${fmt(summary.efficiencyGain)} puntos porcentuales`);
  }
  const headline = parts.length > 0
    ? `El estado futuro propuesto ${parts.join(" y ")}.`
    : "El estado futuro no muestra cambios significativos respecto al actual.";

  // Bullets — sources of improvement
  const bullets: string[] = [];
  const waitMetric = comparison.metrics.find((m) => m.label === "Tiempo de espera");
  if (waitMetric && waitMetric.delta < 0) {
    bullets.push(`Espera reducida en ${fmt(Math.abs(waitMetric.delta))} horas — principal fuente de mejora del lead time.`);
  }
  const processMetric = comparison.metrics.find((m) => m.label === "Tiempo de proceso");
  if (processMetric && processMetric.delta < 0) {
    bullets.push(`Tiempo de proceso reducido en ${fmt(Math.abs(processMetric.delta))} minutos.`);
  }
  if (summary.stepsRemoved > 0) {
    bullets.push(`${summary.stepsRemoved} paso(s) eliminado(s), reduciendo complejidad y handoffs.`);
  }
  if (summary.reworkReduction > 0) {
    bullets.push(`Retrabajo promedio reducido en ${fmt(summary.reworkReduction)} puntos porcentuales.`);
  }
  const addedSteps = stepDiffs.filter((d) => d.added);
  if (addedSteps.length > 0) {
    bullets.push(`${addedSteps.length} paso(s) nuevo(s) agregado(s) para controlar o prevenir problemas.`);
  }

  // Top 3 changes with most impact
  const topChanges = stepDiffs
    .filter((d) => d.impactScore > 0)
    .slice(0, 3)
    .map((d) => {
      let description: string;
      if (d.removed) {
        description = `Paso eliminado — liberó ${fmt(Math.abs(d.waitDelta))}h de espera y ${fmt(Math.abs(d.processDelta))}min de proceso.`;
      } else if (d.added) {
        description = `Nuevo paso agregado en el flujo futuro.`;
      } else {
        const changes: string[] = [];
        if (d.waitDelta !== 0) changes.push(`espera ${d.waitDelta < 0 ? "reducida" : "aumentada"} en ${fmt(Math.abs(d.waitDelta))}h`);
        if (d.processDelta !== 0) changes.push(`proceso ${d.processDelta < 0 ? "reducido" : "aumentado"} en ${fmt(Math.abs(d.processDelta))}min`);
        if (d.reworkDelta !== 0) changes.push(`retrabajo ${d.reworkDelta < 0 ? "reducido" : "aumentado"} en ${fmt(Math.abs(d.reworkDelta))}pp`);
        if (d.renamed) changes.push(`renombrado a "${d.futureName}"`);
        description = changes.length > 0 ? changes.join(", ") + "." : "Sin cambios numéricos significativos.";
      }

      return {
        step: d.removed ? `${d.name} (eliminado)` : d.added ? d.futureName : d.name,
        description,
        justification: d.justification,
      };
    });

  return { headline, bullets, topChanges };
}

// ---------------------------------------------------------------------------
// Plausibility warnings (soft, non-blocking)
// ---------------------------------------------------------------------------

export type WarningLevel = "caution" | "warning";

export interface PlausibilityWarning {
  level: WarningLevel;
  step: string;
  message: string;
}

/**
 * Check step diffs and aggregate comparison for overly optimistic assumptions.
 * Returns warnings sorted by severity (warning > caution).
 */
export function checkPlausibility(
  stepDiffs: StepDiff[],
  comparison: VSMComparison,
): PlausibilityWarning[] {
  const warnings: PlausibilityWarning[] = [];

  for (const d of stepDiffs) {
    if (d.removed || d.added) continue;

    const stepLabel = d.futureName || d.name;

    // 1. Extreme wait reduction
    if (d.waitDelta < 0) {
      if (Math.abs(d.waitDelta) >= 10) {
        warnings.push({
          level: "warning",
          step: stepLabel,
          message: `Espera reducida en ${Math.abs(d.waitDelta).toFixed(1)}h. Reducciones de espera >10h suelen requerir cambios estructurales — ¿está documentada la justificación?`,
        });
      } else if (Math.abs(d.waitDelta) >= 5) {
        warnings.push({
          level: "caution",
          step: stepLabel,
          message: `Espera reducida en ${Math.abs(d.waitDelta).toFixed(1)}h. Verifica que esta mejora sea ejecutable en 30 días.`,
        });
      }
    }

    // 2. Extreme process time reduction (>70%)
    if (d.processDelta < 0 && Math.abs(d.processDelta) >= 30) {
      warnings.push({
        level: "caution",
        step: stepLabel,
        message: `Tiempo de proceso reducido en ${Math.abs(d.processDelta).toFixed(0)}min. Verifica que no se esté subestimando el trabajo real.`,
      });
    }

    // 3. Rework reduced to zero (from any meaningful level)
    if (d.reworkDelta < 0 && d.reworkDelta <= -5) {
      warnings.push({
        level: d.reworkDelta <= -10 ? "warning" : "caution",
        step: stepLabel,
        message: `Retrabajo reducido en ${Math.abs(d.reworkDelta).toFixed(1)}pp. Eliminar retrabajo por completo es poco frecuente sin automatización o rediseño significativo.`,
      });
    }

    // 4. Missing justification on a significant change
    if (!d.justification && d.impactScore > 100) {
      warnings.push({
        level: "caution",
        step: stepLabel,
        message: "Cambio significativo sin justificación documentada. Agrega una razón para hacer auditable esta mejora.",
      });
    }
  }

  // 5. Aggregate: >50% lead time reduction
  if (comparison.summary.leadTimeReductionPct > 50) {
    warnings.push({
      level: "warning",
      step: "General",
      message: `Reducción total de lead time del ${comparison.summary.leadTimeReductionPct.toFixed(0)}%. Reducciones >50% en un solo ciclo de mejora son poco comunes — considera dividir en fases.`,
    });
  }

  // 6. >40% of steps removed
  const { stepsRemoved } = comparison.summary;
  const currentCount = comparison.metrics.find((m) => m.label === "Cantidad de pasos")?.current ?? 0;
  if (currentCount > 0 && stepsRemoved / currentCount > 0.4) {
    warnings.push({
      level: "warning",
      step: "General",
      message: `Se eliminaron ${stepsRemoved} de ${currentCount} pasos (${Math.round(stepsRemoved / currentCount * 100)}%). Eliminar >40% de pasos puede indicar que se están omitiendo actividades necesarias.`,
    });
  }

  // Sort: warnings first, then cautions
  return warnings.sort((a, b) => {
    if (a.level === "warning" && b.level !== "warning") return -1;
    if (a.level !== "warning" && b.level === "warning") return 1;
    return 0;
  });
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
