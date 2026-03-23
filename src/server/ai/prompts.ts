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
