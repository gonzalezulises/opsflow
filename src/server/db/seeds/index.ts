import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../schema";

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// ---------------------------------------------------------------------------
// Helper: calculate initiative score & classification
// ---------------------------------------------------------------------------

function calcInitiative(params: {
  leadTime: number;
  economic: number;
  resilience: number;
  feasibility: number;
  effort: number;
  extDep: number;
}) {
  const score =
    params.leadTime * 0.25 +
    params.economic * 0.25 +
    params.resilience * 0.2 +
    params.feasibility * 0.2 +
    (6 - params.effort) * 0.05 +
    (6 - params.extDep) * 0.05;

  const rounded = Math.round(score * 100) / 100;
  const classification =
    rounded >= 4.0 ? "Atacar ya" : rounded >= 3.2 ? "Diseñar" : "Postergar";

  return { totalScore: rounded.toString(), classification };
}

// ---------------------------------------------------------------------------
// Helper: calculate waste monthly costs
// ---------------------------------------------------------------------------

function calcWaste(params: {
  freqPerWeek: number;
  minutesPerEvent: number;
  hourlyLabor: number;
  unitsAffected: number;
  unitMargin: number;
}) {
  const WEEKS_PER_MONTH = 4.33;
  const laborCostMonthly =
    (params.freqPerWeek * (params.minutesPerEvent / 60) * params.hourlyLabor) *
    WEEKS_PER_MONTH;
  const marginLostMonthly =
    params.freqPerWeek * params.unitsAffected * params.unitMargin * WEEKS_PER_MONTH;
  const totalCostMonthly = laborCostMonthly + marginLostMonthly;

  return {
    laborCostMonthly: laborCostMonthly.toFixed(2),
    marginLostMonthly: marginLostMonthly.toFixed(2),
    totalCostMonthly: totalCostMonthly.toFixed(2),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌱 Seeding OpsFlow database...");

  // -----------------------------------------------------------------------
  // 1. Organization
  // -----------------------------------------------------------------------

  // Clean up existing seed data (idempotent)
  const existingOrgs = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.slug, "opsflow-demo"));

  if (existingOrgs.length > 0) {
    const orgId = existingOrgs[0]!.id;

    // Find cases belonging to this org
    const existingCases = await db
      .select({ id: schema.cases.id })
      .from(schema.cases)
      .where(eq(schema.cases.organizationId, orgId));

    for (const c of existingCases) {
      // Delete child records in dependency order
      await db.delete(schema.actionItems).where(eq(schema.actionItems.caseId, c.id));
      await db.delete(schema.initiatives).where(eq(schema.initiatives.caseId, c.id));
      await db.delete(schema.wasteItems).where(eq(schema.wasteItems.caseId, c.id));
      await db.delete(schema.riskItems).where(eq(schema.riskItems.caseId, c.id));
      await db.delete(schema.processSteps).where(eq(schema.processSteps.caseId, c.id));
      await db
        .delete(schema.diagnosticResponses)
        .where(eq(schema.diagnosticResponses.caseId, c.id));
      await db
        .delete(schema.diagnosticQuestions)
        .where(eq(schema.diagnosticQuestions.caseId, c.id));
      await db
        .delete(schema.prioritizationWeights)
        .where(eq(schema.prioritizationWeights.caseId, c.id));
      await db
        .delete(schema.weeklyMetrics)
        .where(eq(schema.weeklyMetrics.caseId, c.id));
      await db
        .delete(schema.aiInteractions)
        .where(eq(schema.aiInteractions.caseId, c.id));
    }

    await db.delete(schema.cases).where(eq(schema.cases.organizationId, orgId));
    await db.delete(schema.cohorts).where(eq(schema.cohorts.organizationId, orgId));
    await db.delete(schema.organizations).where(eq(schema.organizations.id, orgId));
  }

  console.log("  ✓ Cleaned existing seed data");

  // Create organization
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: "OpsFlow Demo",
      slug: "opsflow-demo",
    })
    .returning();

  console.log(`  ✓ Organization: ${org!.name} (${org!.id})`);

  // -----------------------------------------------------------------------
  // 2. Base case (template)
  // -----------------------------------------------------------------------

  const [baseCase] = await db
    .insert(schema.cases)
    .values({
      name: "Alimentos Santa Emilia — Pedido a Despacho",
      organizationId: org!.id,
      isTemplate: true,
      sector: "Alimentos y consumo masivo",
      companyName: "Alimentos Santa Emilia, C.A.",
      processFocus: "Pedido a despacho",
      currency: "USD",
      locale: "es-VE",
      status: "completed",
      metrics: {
        weeklyOrders: 210,
        avgTicketUsd: 480,
        contributionMargin: 0.22,
        otdOtif: 0.62,
        leadTimeDays: 6.8,
        modifiedOrders: 0.16,
        correctedOrders: 0.18,
        financialHold: 0.11,
        reworkPicking: 0.09,
        microOutageHoursMonth: 9,
      },
    })
    .returning();

  const caseId = baseCase!.id;
  console.log(`  ✓ Case: ${baseCase!.name} (${caseId})`);

  // -----------------------------------------------------------------------
  // 3. Diagnostic questions
  // -----------------------------------------------------------------------

  const questionData: { category: string; questionText: string }[] = [
    // Planificación (3)
    {
      category: "Planificación",
      questionText:
        "¿Existe un flujo documentado y actualizado del proceso de pedido a despacho?",
    },
    {
      category: "Planificación",
      questionText:
        "¿Los roles y responsabilidades de cada etapa están claramente definidos?",
    },
    {
      category: "Planificación",
      questionText:
        "¿Se han establecido métricas de desempeño para el proceso?",
    },
    // Ejecución (3)
    {
      category: "Ejecución",
      questionText:
        "¿Se cumplen los estándares operativos definidos para cada etapa?",
    },
    {
      category: "Ejecución",
      questionText:
        "¿Existe un mecanismo formal para gestionar incidencias en tiempo real?",
    },
    {
      category: "Ejecución",
      questionText:
        "¿La coordinación entre áreas (ventas, almacén, logística) es fluida y oportuna?",
    },
    // Control (3)
    {
      category: "Control",
      questionText:
        "¿Se utilizan indicadores de seguimiento para monitorear el proceso semanalmente?",
    },
    {
      category: "Control",
      questionText:
        "¿Se realizan auditorías internas periódicas sobre el proceso?",
    },
    {
      category: "Control",
      questionText:
        "¿Existe un mecanismo de retroalimentación del cliente interno y externo?",
    },
    // Mejora (3)
    {
      category: "Mejora",
      questionText:
        "¿Hay proyectos de mejora activos relacionados con este proceso?",
    },
    {
      category: "Mejora",
      questionText:
        "¿Existe una cultura organizacional que promueva la mejora continua?",
    },
    {
      category: "Mejora",
      questionText:
        "¿Se utilizan datos y análisis para la toma de decisiones operativas?",
    },
    // Contexto (3)
    {
      category: "Contexto",
      questionText:
        "¿Existe un plan de contingencia ante cortes de energía eléctrica?",
    },
    {
      category: "Contexto",
      questionText:
        "¿Se gestiona activamente la reposición de materiales importados críticos?",
    },
    {
      category: "Contexto",
      questionText:
        "¿Hay un plan de contingencia ante fallas de proveedores de transporte?",
    },
  ];

  const insertedQuestions = await db
    .insert(schema.diagnosticQuestions)
    .values(
      questionData.map((q, i) => ({
        caseId,
        orderIndex: i + 1,
        category: q.category,
        questionText: q.questionText,
      })),
    )
    .returning();

  console.log(`  ✓ Diagnostic questions: ${insertedQuestions.length}`);

  // -----------------------------------------------------------------------
  // 4. Diagnostic responses (avg ~2.7)
  // -----------------------------------------------------------------------

  const scores = [3, 2, 3, 2, 3, 2, 3, 2, 3, 3, 2, 3, 3, 2, 3];

  const insertedResponses = await db
    .insert(schema.diagnosticResponses)
    .values(
      insertedQuestions.map((q, i) => ({
        caseId,
        questionId: q.id,
        score: scores[i]!,
      })),
    )
    .returning();

  console.log(
    `  ✓ Diagnostic responses: ${insertedResponses.length} (avg: ${(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)})`,
  );

  // -----------------------------------------------------------------------
  // 5. Process steps (VSM)
  // -----------------------------------------------------------------------

  const stepsData = [
    {
      stepName: "Registro del pedido",
      department: "Ventas",
      processTimeMinutes: "12",
      waitTimeHours: "4",
      reworkPercentage: "18",
      systemUsed: "ERP + correo",
      addsValue: false,
    },
    {
      stepName: "Validación financiera",
      department: "Crédito y cobranza",
      processTimeMinutes: "15",
      waitTimeHours: "8",
      reworkPercentage: "11",
      systemUsed: "ERP + revisión manual",
      addsValue: false,
    },
    {
      stepName: "Revisión de inventario",
      department: "Planificación",
      processTimeMinutes: "20",
      waitTimeHours: "10",
      reworkPercentage: "7",
      systemUsed: "ERP + Excel",
      addsValue: false,
    },
    {
      stepName: "Producción / picking",
      department: "Planta / almacén",
      processTimeMinutes: "75",
      waitTimeHours: "18",
      reworkPercentage: "9",
      systemUsed: "Hoja de picking",
      addsValue: true,
    },
    {
      stepName: "Facturación",
      department: "Administración",
      processTimeMinutes: "18",
      waitTimeHours: "6",
      reworkPercentage: "3",
      systemUsed: "ERP",
      addsValue: false,
    },
    {
      stepName: "Despacho",
      department: "Logística",
      processTimeMinutes: "12",
      waitTimeHours: "8",
      reworkPercentage: "4",
      systemUsed: "Manual + WhatsApp",
      addsValue: true,
    },
  ];

  const insertedSteps = await db
    .insert(schema.processSteps)
    .values(
      stepsData.map((s, i) => ({
        caseId,
        orderIndex: i + 1,
        ...s,
      })),
    )
    .returning();

  console.log(`  ✓ Process steps: ${insertedSteps.length}`);

  // -----------------------------------------------------------------------
  // 6. Risk items
  // -----------------------------------------------------------------------

  const risksData = [
    {
      riskDescription: "Pedido con datos incompletos",
      riskType: "Disciplina comercial",
      probability: 4,
      impact: 4,
    },
    {
      riskDescription: "Liberación manual por presión",
      riskType: "Gobierno",
      probability: 3,
      impact: 4,
    },
    {
      riskDescription: "Quiebre de empaque importado",
      riskType: "Reposición",
      probability: 4,
      impact: 5,
    },
    {
      riskDescription: "Microcorte en turno",
      riskType: "Energía",
      probability: 3,
      impact: 5,
    },
    {
      riskDescription: "Dependencia de supervisor clave",
      riskType: "Talento",
      probability: 4,
      impact: 4,
    },
    {
      riskDescription: "Camión tercerizado llega tarde",
      riskType: "Proveedor externo",
      probability: 3,
      impact: 4,
    },
  ];

  const insertedRisks = await db
    .insert(schema.riskItems)
    .values(
      risksData.map((r) => ({
        caseId,
        riskDescription: r.riskDescription,
        riskType: r.riskType,
        probability: r.probability,
        impact: r.impact,
        exposure: (r.probability * r.impact).toString(),
      })),
    )
    .returning();

  console.log(`  ✓ Risk items: ${insertedRisks.length}`);

  // -----------------------------------------------------------------------
  // 7. Waste items
  // -----------------------------------------------------------------------

  const wastesRaw = [
    {
      problemDescription: "Corrección de pedidos",
      freqPerWeek: 38,
      minutesPerEvent: 25,
      hourlyLabor: 8,
      unitsAffected: 5,
      unitMargin: 105.6,
    },
    {
      problemDescription: "Pedidos en hold financiero",
      freqPerWeek: 23,
      minutesPerEvent: 45,
      hourlyLabor: 10,
      unitsAffected: 3,
      unitMargin: 105.6,
    },
    {
      problemDescription: "Re-trabajo de picking",
      freqPerWeek: 19,
      minutesPerEvent: 35,
      hourlyLabor: 7,
      unitsAffected: 2,
      unitMargin: 105.6,
    },
    {
      problemDescription: "Quiebre de empaque",
      freqPerWeek: 4,
      minutesPerEvent: 120,
      hourlyLabor: 12,
      unitsAffected: 8,
      unitMargin: 105.6,
    },
  ];

  const insertedWastes = await db
    .insert(schema.wasteItems)
    .values(
      wastesRaw.map((w) => {
        const costs = calcWaste(w);
        return {
          caseId,
          problemDescription: w.problemDescription,
          frequencyPerWeek: w.freqPerWeek.toString(),
          minutesLostPerEvent: w.minutesPerEvent.toString(),
          hourlyLaborCost: w.hourlyLabor.toString(),
          unitsAffected: w.unitsAffected.toString(),
          unitMargin: w.unitMargin.toString(),
          laborCostMonthly: costs.laborCostMonthly,
          marginLostMonthly: costs.marginLostMonthly,
          totalCostMonthly: costs.totalCostMonthly,
        };
      }),
    )
    .returning();

  console.log(`  ✓ Waste items: ${insertedWastes.length}`);

  // -----------------------------------------------------------------------
  // 8. Initiatives
  // -----------------------------------------------------------------------

  const initiativesRaw = [
    {
      name: "Checklist obligatorio de pedido",
      leadTime: 4,
      economic: 4,
      resilience: 3,
      feasibility: 5,
      effort: 2,
      extDep: 1,
    },
    {
      name: "Ventana diaria de liberación financiera",
      leadTime: 3,
      economic: 3,
      resilience: 3,
      feasibility: 4,
      effort: 2,
      extDep: 2,
    },
    {
      name: "Semáforo de materiales críticos",
      leadTime: 3,
      economic: 4,
      resilience: 5,
      feasibility: 3,
      effort: 3,
      extDep: 3,
    },
    {
      name: "Congelar cambios de prioridad después del corte",
      leadTime: 4,
      economic: 3,
      resilience: 4,
      feasibility: 4,
      effort: 2,
      extDep: 1,
    },
    {
      name: "Back-up del supervisor de picking",
      leadTime: 2,
      economic: 2,
      resilience: 5,
      feasibility: 4,
      effort: 3,
      extDep: 1,
    },
  ];

  const insertedInitiatives = await db
    .insert(schema.initiatives)
    .values(
      initiativesRaw.map((init) => {
        const { totalScore, classification } = calcInitiative(init);
        return {
          caseId,
          name: init.name,
          impactLeadTime: init.leadTime.toString(),
          impactEconomic: init.economic.toString(),
          impactResilience: init.resilience.toString(),
          feasibility30d: init.feasibility.toString(),
          effort: init.effort.toString(),
          externalDependency: init.extDep.toString(),
          totalScore,
          classification,
        };
      }),
    )
    .returning();

  console.log(`  ✓ Initiatives: ${insertedInitiatives.length}`);

  // Log initiative scores for verification
  for (const init of insertedInitiatives) {
    console.log(
      `    - ${init.name}: ${init.totalScore} → ${init.classification}`,
    );
  }

  // -----------------------------------------------------------------------
  // 9. Action items
  // -----------------------------------------------------------------------

  const actionItemsData = [
    {
      initiativeIdx: 0, // Checklist obligatorio
      actionDescription:
        "Diseñar e implementar checklist digital de campos obligatorios en el ERP para registro de pedidos",
      responsible: "Jefe de Ventas",
      startDate: "2026-04-01",
      endDate: "2026-04-15",
      leadMetric: "% pedidos con datos completos",
      baselineValue: "82",
      targetValue: "95",
      contingency:
        "Implementar validación manual con supervisor si el ERP no permite personalización rápida",
    },
    {
      initiativeIdx: 1, // Ventana diaria
      actionDescription:
        "Establecer ventana de liberación financiera de 10:00 a 11:00 con SLA de respuesta de 30 minutos",
      responsible: "Gerente de Crédito y Cobranza",
      startDate: "2026-04-01",
      endDate: "2026-04-08",
      leadMetric: "% pedidos liberados en ventana",
      baselineValue: "0",
      targetValue: "80",
      contingency:
        "Autorización provisional del supervisor de turno si el analista no está disponible",
    },
    {
      initiativeIdx: 2, // Semáforo materiales
      actionDescription:
        "Crear dashboard de semáforo de materiales críticos importados con alertas a 30, 15 y 7 días",
      responsible: "Jefe de Planificación",
      startDate: "2026-04-07",
      endDate: "2026-04-28",
      leadMetric: "# quiebres de empaque por mes",
      baselineValue: "17",
      targetValue: "5",
      contingency:
        "Mantener stock de seguridad de empaque genérico como alternativa temporal",
    },
    {
      initiativeIdx: 3, // Congelar cambios
      actionDescription:
        "Definir política de corte: cambios de prioridad solo hasta las 14:00 del día anterior al despacho",
      responsible: "Gerente de Operaciones",
      startDate: "2026-04-01",
      endDate: "2026-04-10",
      leadMetric: "% pedidos modificados post-corte",
      baselineValue: "16",
      targetValue: "5",
      contingency:
        "Aprobación escrita del Director Comercial para excepciones justificadas",
    },
    {
      initiativeIdx: 4, // Back-up supervisor
      actionDescription:
        "Capacitar a dos operarios como back-up del supervisor de picking con certificación interna",
      responsible: "Supervisor de Almacén",
      startDate: "2026-04-07",
      endDate: "2026-05-05",
      leadMetric: "# personas certificadas como back-up",
      baselineValue: "0",
      targetValue: "2",
      contingency:
        "Contratar supervisor temporal si ambos candidatos internos no completan la certificación",
    },
  ];

  const insertedActions = await db
    .insert(schema.actionItems)
    .values(
      actionItemsData.map((a) => ({
        caseId,
        initiativeId: insertedInitiatives[a.initiativeIdx]!.id,
        actionDescription: a.actionDescription,
        responsible: a.responsible,
        startDate: a.startDate,
        endDate: a.endDate,
        leadMetric: a.leadMetric,
        baselineValue: a.baselineValue,
        targetValue: a.targetValue,
        contingency: a.contingency,
        status: "pending" as const,
      })),
    )
    .returning();

  console.log(`  ✓ Action items: ${insertedActions.length}`);

  // -----------------------------------------------------------------------
  // 10. Prioritization weights (defaults)
  // -----------------------------------------------------------------------

  const [weights] = await db
    .insert(schema.prioritizationWeights)
    .values({
      caseId,
      impactLeadTime: "0.25",
      impactEconomic: "0.25",
      impactResilience: "0.20",
      feasibility30d: "0.20",
      effort: "0.05",
      externalDependency: "0.05",
    })
    .returning();

  console.log(`  ✓ Prioritization weights: ${weights!.id}`);

  // -----------------------------------------------------------------------
  // Done
  // -----------------------------------------------------------------------

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await client.end();
  });
