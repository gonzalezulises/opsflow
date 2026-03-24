import type { ModuleGuideContent } from "@/components/shared/module-guide";

export const MODULE_GUIDES: Record<string, ModuleGuideContent> = {
  context: {
    stepNumber: 1,
    title: "Contexto del caso — Encuadre estratégico",
    explanation:
      "Este paso define el terreno de juego. Antes de analizar cualquier proceso, necesitas entender la empresa, su sector, el proceso que vas a intervenir y las métricas actuales. Sin un contexto claro, cualquier diagnóstico posterior carece de dirección.",
    concept:
      "El encuadre estratégico (Strategic Framing) establece los límites del análisis: qué proceso, qué empresa, qué restricciones y qué métricas importan. Es la diferencia entre un análisis enfocado y uno que se pierde en generalidades.",
    objective:
      "Documentar el caso con suficiente precisión para que cualquier persona del equipo entienda qué empresa, qué proceso y qué punto de partida tiene. Las métricas base se convierten en la línea de comparación para medir mejoras.",
    howTo: [
      "Llena los datos de la empresa: nombre, sector, proceso foco",
      "Registra las métricas base actuales (pedidos, ticket, OTD/OTIF, lead time)",
      "Documenta restricciones conocidas: hold financiero, retrabajo, microcortes",
      "Agrega observaciones sobre síntomas visibles o hipótesis iniciales",
      "Revisa que los números sean verificables — no estimaciones vagas",
    ],
    risksToAvoid: [
      "Llenar métricas con estimaciones sin fuente: distorsiona todo el análisis posterior",
      "Definir un proceso demasiado amplio: 'toda la cadena' es inmanejable en 30 días",
      "Omitir restricciones contextuales (energía, reposición) que luego invalidan las recomendaciones",
      "Confundir métricas de deseo con métricas reales actuales",
    ],
    reference: {
      text: "Womack & Jones — Lean Thinking, Cap. 1: Value (definir el punto de partida antes de mapear el flujo)",
      url: "https://www.lean.org/lexicon-terms/lean-thinking/",
    },
  },

  diagnostic: {
    stepNumber: 2,
    title: "Diagnóstico de madurez — ¿Dónde estamos?",
    explanation:
      "El diagnóstico evalúa 15 dimensiones de madurez operativa agrupadas en 5 categorías: Planificación, Ejecución, Control, Mejora y Contexto. Cada pregunta se puntúa del 1 al 5. El resultado revela fortalezas, debilidades y contradicciones que orientan el resto del análisis.",
    concept:
      "Un modelo de madurez mide la capacidad de una organización para ejecutar y mejorar sus procesos de forma sistemática. No es un juicio de valor: es un mapa de dónde están los gaps. Un nivel 'bajo' no significa fracaso — significa oportunidad clara de mejora.",
    objective:
      "Obtener un puntaje de madurez operativa (bajo < 2.5, medio < 3.8, alto ≥ 3.8) que identifique las categorías más débiles y guíe la priorización de mejoras en los siguientes pasos.",
    howTo: [
      "Lee cada pregunta con el equipo — no la responda solo una persona",
      "Puntúa del 1 (no existe o es muy informal) al 5 (sistemático y medido)",
      "Agrega comentarios donde haya matices importantes o desacuerdos",
      "Revisa el resumen: ¿el nivel refleja la realidad que vive el equipo?",
      "Identifica las 2-3 categorías con puntaje más bajo como focos de atención",
    ],
    risksToAvoid: [
      "Autocomplacencia: puntuar alto sin evidencia — 'creemos que lo hacemos bien' no es 5",
      "Puntuar todo igual: si todas las respuestas son 3, el diagnóstico no aporta información",
      "Ignorar las contradicciones: si Planificación es alta pero Control es bajo, algo no cuadra",
      "Que solo responda el jefe: el diagnóstico pierde valor sin perspectivas múltiples",
    ],
    reference: {
      text: "CMMI Institute — Capability Maturity Model Integration (base conceptual de modelos de madurez por niveles)",
      url: "https://cmmiinstitute.com/cmmi",
    },
  },

  vsm: {
    stepNumber: 3,
    title: "Mapa de flujo de valor (VSM) — Ver el proceso real",
    explanation:
      "El VSM documenta cada paso del proceso desde el pedido hasta el despacho: cuánto tiempo toma procesar, cuánto se espera entre pasos, cuánto se retrabaja y qué sistemas se usan. Separa lo que agrega valor de lo que no. El resultado es la eficiencia de flujo: qué porcentaje del tiempo total realmente genera valor.",
    concept:
      "Value Stream Mapping es una herramienta lean que hace visible el flujo completo de un proceso. La métrica clave es la eficiencia de flujo = tiempo de valor / lead time total. En la mayoría de las empresas, esta eficiencia está entre 1% y 5% — la mayor parte del tiempo se va en esperas, no en trabajo real.",
    objective:
      "Mapear todos los pasos del proceso con tiempos reales, identificar el cuello de botella principal (mayor espera), calcular la eficiencia de flujo y detectar los pasos que no agregan valor.",
    howTo: [
      "Lista cada paso del proceso en orden secuencial",
      "Para cada paso registra: departamento, tiempo de proceso (min), tiempo de espera (h), % retrabajo, sistema usado",
      "Marca si cada paso agrega valor al cliente final o no",
      "Revisa los cálculos automáticos: lead time total, eficiencia de flujo",
      "Identifica el paso con mayor espera — ese es tu cuello de botella",
      "Usa el toggle para comparar modo lean (correcto) vs modo Excel (legado)",
    ],
    risksToAvoid: [
      "Confundir tiempo de proceso con tiempo de espera: el proceso son los minutos de trabajo activo",
      "Mapear el proceso ideal en vez del real — el VSM debe reflejar lo que pasa hoy",
      "No distinguir valor agregado: 'validación financiera' no le agrega valor al cliente, aunque sea necesaria",
      "Olvidar los handoffs informales: si la coordinación es por WhatsApp, eso es un paso del proceso",
    ],
    reference: {
      text: "Rother & Shook — Learning to See (el libro fundacional de Value Stream Mapping)",
      url: "https://www.lean.org/store/book/learning-to-see/",
    },
  },

  risks: {
    stepNumber: 4,
    title: "Riesgo contextual — ¿Qué puede salir mal?",
    explanation:
      "Este módulo identifica los riesgos operativos específicos del contexto: energía, reposición de materiales importados, dependencia de talento clave, proveedores tercerizados, disciplina comercial y gobierno interno. Cada riesgo se evalúa por probabilidad (1-5) e impacto (1-5). La exposición = probabilidad × impacto.",
    concept:
      "La gestión de riesgos contextuales va más allá del FMEA tradicional. En entornos como Venezuela, los riesgos operativos no son solo fallas internas — incluyen factores exógenos (cortes de energía, restricciones de importación) que deben tener mitigaciones específicas y señales tempranas.",
    objective:
      "Construir una matriz de riesgos que identifique los 2-3 riesgos con mayor exposición, defina señales tempranas de activación y proponga mitigaciones concretas y ejecutables con recursos limitados.",
    howTo: [
      "Revisa cada paso del VSM y pregunta: ¿qué puede fallar aquí?",
      "Clasifica el riesgo por tipo: energía, talento, reposición, gobierno, proveedor externo",
      "Asigna probabilidad (1-5) e impacto (1-5) con criterio del equipo",
      "Define señales tempranas: ¿cómo sabemos que el riesgo se está activando?",
      "Propón mitigaciones realistas — no planes ideales que requieran inversión masiva",
    ],
    risksToAvoid: [
      "Subestimar riesgos por normalización: 'siempre hay microcortes' no significa que no sea un riesgo",
      "Listar riesgos genéricos sin vincularlos a pasos específicos del proceso",
      "No definir señales tempranas: si solo reaccionas cuando el riesgo se materializa, ya es tarde",
      "Proponer mitigaciones que dependen de recursos que no existen",
    ],
    reference: {
      text: "ISO 31000:2018 — Risk Management Guidelines (marco de referencia para gestión de riesgos)",
      url: "https://www.iso.org/iso-31000-risk-management.html",
    },
  },

  waste: {
    stepNumber: 5,
    title: "Costo del desperdicio — ¿Cuánto nos cuesta?",
    explanation:
      "Este módulo convierte los problemas operativos en dinero. Para cada problema (corrección de pedidos, hold financiero, retrabajo, quiebres) calcula el costo laboral mensual y el margen perdido. El resultado es un ranking económico que justifica la inversión en mejoras.",
    concept:
      "El costo del desperdicio (Cost of Poor Quality — COPQ) tiene dos componentes: el costo directo de corregir errores (horas-hombre desperdiciadas) y el costo de oportunidad (margen que se pierde por no vender). En la mayoría de las empresas, el COPQ está entre 5% y 25% de las ventas totales.",
    objective:
      "Cuantificar en USD mensuales cuánto cuesta cada problema operativo, identificar la principal fuga económica y crear un business case claro para las mejoras priorizadas.",
    howTo: [
      "Para cada problema, registra: frecuencia semanal, minutos perdidos por evento, costo hora laboral",
      "Si aplica, registra: unidades afectadas y margen por unidad",
      "El sistema calcula automáticamente: costo laboral mensual, margen perdido mensual, costo total",
      "Revisa el ranking: ¿el problema #1 coincide con tu intuición?",
      "Usa estos números para justificar las iniciativas del siguiente paso",
    ],
    risksToAvoid: [
      "Inventar frecuencias sin datos: mejor un estimado conservador que un número inflado",
      "Olvidar el margen perdido: el costo laboral es solo una parte — el margen no vendido suele ser mayor",
      "No validar el costo hora: usar el salario mensual ÷ 160h es una buena aproximación",
      "Asumir que el problema se resuelve solo: sin intervención, los costos solo crecen",
    ],
    reference: {
      text: "ASQ — Cost of Quality (COQ) methodology (marco para cuantificar costos de no-calidad)",
      url: "https://asq.org/quality-resources/cost-of-quality",
    },
  },

  prioritization: {
    stepNumber: 6,
    title: "Priorización de iniciativas — ¿Qué atacamos primero?",
    explanation:
      "Con los hallazgos de los pasos anteriores, ahora evalúas las iniciativas de mejora con una matriz ponderada. Cada iniciativa se puntúa en 6 dimensiones: impacto en lead time, impacto económico, resiliencia, factibilidad a 30 días, esfuerzo y dependencia externa. El resultado clasifica las iniciativas en: Atacar ya, Diseñar o Postergar.",
    concept:
      "La matriz de priorización ponderada evita dos trampas comunes: atacar lo fácil pero poco impactante, o planificar lo ambicioso pero inviable. Los pesos por defecto (25% lead time, 25% económico, 20% resiliencia, 20% factibilidad, 5% esfuerzo inverso, 5% dependencia inversa) balancean impacto con ejecutabilidad.",
    objective:
      "Clasificar cada iniciativa como 'Atacar ya' (≥ 4.0), 'Diseñar' (≥ 3.2) o 'Postergar' (< 3.2) para concentrar los recursos limitados en las acciones de mayor retorno en los próximos 30 días.",
    howTo: [
      "Lista todas las iniciativas que surgieron del diagnóstico, VSM, riesgos y desperdicio",
      "Para cada una, puntúa del 1 al 5 en las 6 dimensiones",
      "Revisa el score calculado y la clasificación automática",
      "Cuestiona: ¿las que quedaron como 'Atacar ya' son realmente ejecutables en 30 días?",
      "Ajusta los pesos si tu contexto lo requiere (ej: si la resiliencia es crítica, aumenta su peso)",
    ],
    risksToAvoid: [
      "Puntuar todo alto: si todas las iniciativas son 'Atacar ya', no priorizaste nada",
      "Ignorar la factibilidad: una iniciativa con impacto 5 pero factibilidad 1 no se ejecuta en 30 días",
      "No considerar dependencias externas: si necesitas aprobación de 3 áreas, la factibilidad real baja",
      "Cambiar los pesos para que salga lo que quieres: los pesos se definen antes, no después",
    ],
    reference: {
      text: "Eisenhower Matrix + Weighted Scoring Model (combinación de urgencia/importancia con evaluación multi-criterio)",
      url: "https://asq.org/quality-resources/decision-matrix",
    },
  },

  plan: {
    stepNumber: 7,
    title: "Plan de 30 días — De la priorización a la acción",
    explanation:
      "Las iniciativas priorizadas como 'Atacar ya' se convierten aquí en acciones concretas con responsable, fechas, métrica líder, línea base, meta y contingencia. Un plan de 30 días no es un proyecto de transformación — es un sprint de mejora enfocado en resultados medibles.",
    concept:
      "El plan de 30 días sigue la lógica PDCA (Plan-Do-Check-Act) de Deming: cada acción tiene una métrica líder que permite verificar si la mejora funcionó. La contingencia anticipa qué hacer si la acción no sale como se planificó. Sin métrica, no hay aprendizaje; sin contingencia, no hay resiliencia.",
    objective:
      "Convertir las 3-5 iniciativas priorizadas en acciones ejecutables con responsable claro, métrica medible, meta a 30 días y plan B si algo falla.",
    howTo: [
      "Para cada iniciativa 'Atacar ya', define 1-2 acciones concretas",
      "Asigna UN responsable por acción — si todos son responsables, nadie lo es",
      "Define la métrica líder: ¿qué número vamos a mover?",
      "Registra la línea base (valor actual) y la meta (valor esperado a 30 días)",
      "Define la contingencia: ¿qué hacemos si no funciona o si hay un bloqueo?",
      "Pon fechas realistas — no comprimas todo en la primera semana",
    ],
    risksToAvoid: [
      "Acciones vagas: 'mejorar el proceso' no es una acción — 'implementar checklist de pedido' sí lo es",
      "Metas sin métrica: 'reducir errores' no es medible — 'reducir % pedidos con error de 18% a 8%' sí",
      "Muchas acciones sin foco: mejor 5 bien ejecutadas que 15 a medias",
      "No definir contingencia: en entornos con alta variabilidad, siempre necesitas un plan B",
    ],
    reference: {
      text: "Deming — PDCA Cycle / Shewhart Cycle (base metodológica del ciclo de mejora continua)",
      url: "https://deming.org/explore/pdsa/",
    },
  },

  tracking: {
    stepNumber: 8,
    title: "Seguimiento semanal — ¿Estamos mejorando?",
    explanation:
      "Cada semana se registran las métricas clave: lead time, OTD/OTIF, pedidos corregidos, órdenes reprogramadas, retrabajo de picking y avance del plan. El sistema detecta automáticamente si hay 2+ semanas consecutivas de deterioro en cualquier métrica y genera alertas.",
    concept:
      "El seguimiento semanal es el 'Check' del ciclo PDCA. Sin medición recurrente, no sabes si las acciones están funcionando. La clave no es solo registrar números sino actuar sobre las tendencias: si una métrica se deteriora 2 semanas seguidas, hay que investigar antes de que se convierta en crisis.",
    objective:
      "Mantener visibilidad semanal sobre las métricas clave, detectar deterioros temprano y ajustar el plan de 30 días cuando sea necesario.",
    howTo: [
      "Al final de cada semana, registra las 6 métricas del caso",
      "Compara contra la semana anterior y contra la meta del plan",
      "Si hay alerta de deterioro (2+ semanas empeorando), investiga la causa raíz",
      "Actualiza el avance del plan: ¿las acciones se están ejecutando?",
      "Agrega notas con contexto: ¿hubo algún evento inusual esta semana?",
    ],
    risksToAvoid: [
      "No registrar datos semanalmente: gaps en el seguimiento hacen imposible detectar tendencias",
      "Reaccionar a una sola semana mala: la variación natural existe — el patrón importa más que el dato puntual",
      "Ignorar las alertas del sistema: si lleva 2 semanas deteriorando, algo está pasando",
      "Registrar números sin acción: el seguimiento sin respuesta es solo burocracia",
    ],
    reference: {
      text: "Wheeler — Understanding Variation (la referencia para interpretar datos de proceso sin sobre-reaccionar)",
      url: "https://www.spcpress.com/book_understanding_variation.php",
    },
  },

  report: {
    stepNumber: 9,
    title: "Reporte ejecutivo — Comunicar resultados",
    explanation:
      "El reporte ejecutivo consolida todos los hallazgos del caso en un formato que se puede presentar a la gerencia, al sponsor del proyecto o al equipo. Resume: nivel de madurez, cuello de botella principal, riesgo prioritario, fuga económica principal, quick wins ejecutados y estado del plan.",
    concept:
      "Un reporte ejecutivo efectivo no repite todos los datos — sintetiza las decisiones y sus resultados. La regla de oro: un ejecutivo debe poder leerlo en 5 minutos y entender qué se hizo, qué se encontró y qué se recomienda como siguiente paso.",
    objective:
      "Generar un documento de cierre que sirva como evidencia del trabajo realizado, base para decisiones gerenciales y punto de partida para el siguiente ciclo de mejora.",
    howTo: [
      "Revisa que todos los módulos anteriores estén completos",
      "El reporte se genera automáticamente con los datos del caso",
      "Revisa el resumen: ¿refleja con precisión lo que encontró el equipo?",
      "Usa la asistencia IA para generar versiones en lenguaje ejecutivo o de facilitación",
      "Exporta el reporte para presentación o archivo",
    ],
    risksToAvoid: [
      "Presentar datos sin interpretación: los números sin contexto no comunican",
      "Omitir lo que no funcionó: un reporte solo de éxitos pierde credibilidad",
      "No definir el siguiente paso: todo reporte debe cerrar con una recomendación accionable",
      "Generar el reporte sin revisión del equipo: el reporte es del equipo, no del facilitador",
    ],
    reference: {
      text: "Minto — The Pyramid Principle (estructura de comunicación ejecutiva: conclusión primero, evidencia después)",
      url: "https://www.barbaraminto.com/",
    },
  },
};
