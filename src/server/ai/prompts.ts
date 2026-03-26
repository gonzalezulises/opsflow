export const SYSTEM_PROMPT = `Eres un consultor experto en excelencia operativa, lean manufacturing y mejora continua.
Estás asistiendo a un equipo que analiza un caso real de optimización de procesos en una empresa en Venezuela.

CONTEXTO IMPORTANTE:
- Las empresas en Venezuela enfrentan restricciones reales: cortes de energía, dificultad para reponer materiales importados, transporte tercerizado poco confiable, dependencia de talento clave, y coordinación informal por WhatsApp.
- Tus recomendaciones deben ser pragmáticas y ejecutables con recursos limitados.
- Prioriza soluciones de bajo costo y alto impacto.
- Usa lenguaje claro y directo, en español.

REGLAS:
- NUNCA modifiques datos del usuario silenciosamente.
- Solo sugiere, resume, señala inconsistencias o propón hipótesis/acciones.
- Toda cifra que menciones debe ser trazable a los datos proporcionados.
- Si detectas datos inconsistentes, señálalo explícitamente.
- Sé específico y accionable, no genérico.`;

export function diagnosticPrompt(context: string): string {
  return `Analiza los resultados del diagnóstico de madurez operativa del caso.

DATOS:
${context}

Genera un resumen estructurado con: evaluación general, hallazgos críticos, contradicciones entre respuestas, áreas foco y quick wins.`;
}

export function vsmPrompt(context: string): string {
  return `Analiza el mapa de flujo de valor (VSM) del caso.

DATOS:
${context}

Identifica: cuello de botella principal, análisis de esperas, preocupaciones de retrabajo, riesgos de coordinación entre áreas, oportunidades quick win, y comentario sobre eficiencia de flujo.`;
}

export function riskPrompt(context: string): string {
  return `Analiza la matriz de riesgos contextuales del caso.

DATOS:
${context}

Identifica: riesgo prioritario con justificación, señales tempranas por riesgo, mitigaciones propuestas, e insights considerando el contexto operativo de Venezuela.`;
}

export function wastePrompt(context: string): string {
  return `Analiza los costos de desperdicio del caso.

DATOS:
${context}

Explica: impacto total, principal fuga con análisis de sensibilidad, supuestos clave y su impacto, y la mayor oportunidad económica.`;
}

export function prioritizationPrompt(context: string): string {
  return `Revisa la priorización de iniciativas del caso.

DATOS:
${context}

Evalúa: consistencia de la priorización, detecta inconsistencias, y propón un orden recomendado con justificación.`;
}

export function actionPlanPrompt(context: string): string {
  return `Revisa el plan de 30 días del caso.

DATOS:
${context}

Evalúa: calidad del plan, acciones vagas o no medibles, acciones faltantes, y riesgos del plan actual.`;
}

export function weeklyReviewPrompt(context: string): string {
  return `Genera un weekly review del seguimiento del caso.

DATOS:
${context}

Resume: estado de la semana, métricas que mejoraron, que empeoraron, riesgos emergentes, y recomendación principal.`;
}

export function executiveReportPrompt(context: string): string {
  return `Genera un reporte ejecutivo completo del caso.

DATOS:
${context}

Incluye: resumen ejecutivo, hallazgos clave por área, top recomendaciones con prioridad y timeline, y perspectiva a 30-60 días.`;
}

// ─── Improvement narrative refinement ───

export function improvementNarrativePrompt(context: string): string {
  return `Refina la narrativa de mejora de un caso de optimización operativa.

DATOS ESTRUCTURADOS (generados por el sistema, NO inventados):
${context}

INSTRUCCIONES:
- El executiveSummary debe ser presentable ante un comité gerencial: 3-4 oraciones, tono profesional, basado SOLO en los datos proporcionados.
- Los keyInsights deben agregar valor analítico: conexiones entre métricas, implicaciones de negocio, o perspectivas que no son obvias al leer los números solos.
- Las inconsistencies deben señalar si alguna mejora parece contradictoria, excesiva o no justificada.
- Los scenarioRisks deben identificar qué podría fallar al ejecutar esta propuesta: dependencias, capacidad organizacional, riesgos de implementación.
- La strengthenedNarrative es una versión pulida del resumen — mantén los números exactos, mejora la redacción y la estructura argumentativa.
- NO inventes cifras. Toda métrica debe venir de los datos proporcionados.
- Si detectas datos inconsistentes, señálalo en inconsistencies.`;
}

// ─── Generation prompts (cross-module) ───

export function riskGenerationPrompt(context: string): string {
  return `Genera riesgos contextuales para este caso basándote en los pasos del VSM y el contexto operativo.

DATOS:
${context}

INSTRUCCIONES:
- Genera entre 5 y 8 riesgos relevantes.
- Basa los riesgos en las esperas largas, retrabajo alto, handoffs problemáticos y dependencias del VSM.
- Incluye riesgos exógenos típicos del contexto Venezuela (energía, reposición, talento, proveedor).
- Para cada riesgo asigna probabilidad e impacto (1-5) de forma realista.
- Las señales tempranas deben ser observables SIN necesidad de sistemas sofisticados.
- Las mitigaciones deben ser ejecutables con recursos limitados.
- El riskType DEBE ser exactamente uno de: "Disciplina comercial", "Gobierno", "Reposición", "Energía", "Talento", "Proveedor externo", "Tecnología", "Regulatorio", "Otro".`;
}

export function initiativeGenerationPrompt(context: string): string {
  return `Genera iniciativas de mejora basándote en los riesgos, desperdicios y diagnóstico del caso.

DATOS:
${context}

INSTRUCCIONES:
- Genera entre 5 y 8 iniciativas concretas.
- Cada iniciativa debe atacar al menos un riesgo crítico, una fuga de desperdicio, o un gap del diagnóstico.
- Prioriza quick wins: alto impacto, bajo esfuerzo, ejecutables en 30 días.
- Los scores (1-5) deben ser consistentes: si una iniciativa es fácil, effort debe ser bajo (1-2).
- impactLeadTime y impactEconomic son los más importantes.
- Nombres cortos y accionables (ej: "Buffer de inventario para picking", no "Mejora general del proceso").
- Incluye al menos 2 iniciativas de bajo esfuerzo (effort ≤ 2) que se puedan ejecutar esta semana.`;
}

export function actionPlanGenerationPrompt(context: string): string {
  return `Genera un plan de acciones de 30 días basado en las iniciativas priorizadas.

DATOS:
${context}

INSTRUCCIONES:
- Genera entre 5 y 10 acciones concretas, priorizando las iniciativas clasificadas como "Atacar ya".
- Cada acción debe ser SMART: específica, medible, alcanzable, relevante y con tiempo definido.
- El responsable debe ser un ROL (ej: "Jefe de almacén"), no un nombre.
- La métrica líder debe ser cuantificable (ej: "Lead time en horas", no "mejorar el proceso").
- El baseline y target deben ser numéricos cuando sea posible.
- Las contingencias deben ser acciones concretas, no genéricas.
- Distribuye las acciones a lo largo de las 4 semanas del plan.
- NO uses markdown ni bullet points en los campos — solo texto plano.`;
}
