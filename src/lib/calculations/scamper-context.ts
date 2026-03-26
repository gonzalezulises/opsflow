/**
 * Builds a structured, grounded context string for the SCAMPER AI prompt.
 * All data is pre-computed server-side — no AI involvement in building context.
 */

interface StepData {
  stepName: string;
  department: string | null;
  processTimeMinutes: number;
  waitTimeHours: number;
  reworkPercentage: number;
  addsValue: boolean;
}

interface RiskData {
  description: string;
  type: string;
  exposure: number;
}

interface WasteData {
  problem: string;
  costMonthly: number;
}

interface VsmMetrics {
  leadTimeHours: number;
  flowEfficiency: number;
  avgRework: number;
  stepsCount: number;
}

export interface ScamperContextInput {
  companyName: string;
  sector: string;
  processFocus: string;
  steps: StepData[];
  risks: RiskData[];
  wastes: WasteData[];
  metrics: VsmMetrics | null;
}

export function buildScamperContext(input: ScamperContextInput): string {
  const sections: string[] = [];

  // 1. Case header
  sections.push(
    `CASO: ${input.companyName} | Sector: ${input.sector} | Proceso: ${input.processFocus}`
  );

  // 2. VSM metrics summary
  if (input.metrics) {
    const m = input.metrics;
    sections.push([
      "MÉTRICAS VSM:",
      `  Lead time: ${m.leadTimeHours.toFixed(1)}h`,
      `  Eficiencia de flujo: ${m.flowEfficiency.toFixed(1)}%`,
      `  Retrabajo promedio: ${m.avgRework.toFixed(1)}%`,
      `  Pasos totales: ${m.stepsCount}`,
    ].join("\n"));
  }

  // 3. Steps — top 7 by wait time (bottlenecks first)
  const sortedSteps = [...input.steps]
    .sort((a, b) => b.waitTimeHours - a.waitTimeHours)
    .slice(0, 7);

  sections.push(
    "PASOS DEL VSM (ordenados por espera, top 7):\n" +
    sortedSteps.map((s, i) =>
      `  ${i + 1}. ${s.stepName} (${s.department ?? "?"}) — Proceso: ${s.processTimeMinutes}min, Espera: ${s.waitTimeHours}h, Retrabajo: ${s.reworkPercentage}%, Valor: ${s.addsValue ? "Sí" : "No"}`
    ).join("\n")
  );

  // 4. Highlight bottlenecks explicitly
  const bottlenecks = input.steps.filter(s => s.waitTimeHours >= 6 || s.reworkPercentage >= 10);
  if (bottlenecks.length > 0) {
    sections.push(
      "CUELLOS DE BOTELLA (espera ≥6h o retrabajo ≥10%):\n" +
      bottlenecks.map(s =>
        `  - ${s.stepName}: ${s.waitTimeHours}h espera, ${s.reworkPercentage}% retrabajo`
      ).join("\n")
    );
  }

  // 5. Non-value-add steps
  const nva = input.steps.filter(s => !s.addsValue);
  if (nva.length > 0) {
    sections.push(
      `PASOS SIN VALOR AGREGADO (${nva.length} de ${input.steps.length}):\n` +
      nva.map(s => `  - ${s.stepName} (${s.processTimeMinutes}min proceso + ${s.waitTimeHours}h espera)`).join("\n")
    );
  }

  // 6. Top 5 risks by exposure
  if (input.risks.length > 0) {
    const topRisks = [...input.risks]
      .sort((a, b) => b.exposure - a.exposure)
      .slice(0, 5);

    sections.push(
      "RIESGOS PRIORITARIOS (top 5 por exposición):\n" +
      topRisks.map((r, i) =>
        `  ${i + 1}. [${r.type}] ${r.description} — Exposición: ${r.exposure}`
      ).join("\n")
    );
  }

  // 7. Top 5 wastes by cost
  if (input.wastes.length > 0) {
    const topWastes = [...input.wastes]
      .sort((a, b) => b.costMonthly - a.costMonthly)
      .slice(0, 5);

    sections.push(
      "DESPERDICIOS MÁS COSTOSOS (top 5):\n" +
      topWastes.map((w, i) =>
        `  ${i + 1}. ${w.problem} — $${w.costMonthly.toFixed(0)}/mes`
      ).join("\n")
    );
  }

  return sections.join("\n\n");
}
