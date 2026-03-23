# Alcance del producto — OpsFlow

## Visión

OpsFlow es una herramienta web de optimización operacional que digitaliza y mejora el proceso de análisis, diagnóstico y mejora continua utilizado en bootcamps de Lean/Six Sigma en Venezuela. Reemplaza un toolkit de Excel con una solución moderna, colaborativa y asistida por IA.

## Usuarios objetivo

### Facilitadores

- Consultores que guían a equipos a través del proceso de optimización.
- Necesitan crear casos, configurar análisis y generar reportes.
- Son el usuario principal. La experiencia debe priorizar su flujo de trabajo.

### Equipos de participantes

- Profesionales de empresas venezolanas que ejecutan la optimización de un proceso real.
- Capturan datos, realizan análisis y desarrollan planes de mejora.
- Nivel técnico variable. La UI debe ser intuitiva sin capacitación extensa.

### Observadores

- Gerentes, sponsors o stakeholders que monitorean el progreso.
- Solo necesitan ver dashboards y reportes ejecutivos.
- Acceso de solo lectura.

## Módulos

### Módulo A — Diagnóstico operacional

Evaluación inicial del proceso mediante cuestionario estructurado por categorías (calidad, productividad, costos, entrega, seguridad). Genera un score de madurez y radar chart.

**IA:** `diagnostico_summary` — resumen ejecutivo con hallazgos y recomendaciones.

### Módulo B — Value Stream Mapping (VSM)

Mapeo del flujo de valor con pasos, tiempos (proceso, espera, transporte), operadores y tasa de defectos. Calcula lead time, process time, PCE, takt time. Soporta estado actual y estado futuro.

**IA:** `vsm_analysis` — identificación de cuellos de botella y oportunidades.

### Módulo C — Matriz de riesgos

Identificación y evaluación de riesgos por probabilidad e impacto. Matriz 5x5 con clasificación por severidad. Planes de mitigación.

**IA:** `risk_recommendations` — estrategias de mitigación por riesgo.

### Módulo D — Análisis de desperdicios

Identificación de los 8 desperdicios de Lean (TIMWOODS) con frecuencia, costo estimado y causa raíz. Vinculación con pasos del VSM.

**IA:** `waste_cost_explanation` — explicación del impacto económico.

### Módulo E — Priorización de mejoras

Matriz de priorización impacto vs. factibilidad. Identificación de quick wins. Ordenamiento de mejoras por prioridad calculada.

**IA:** `prioritization_review` — revisión y justificación del ordenamiento.

### Módulo F — Plan de acción

Desglose de mejoras en acciones concretas con responsable, plazo, recursos y KPI. Línea de tiempo visual.

**IA:** `action_plan_suggestions` — sugerencias de acciones y plazos.

### Módulo G — Seguimiento semanal

Tracking del progreso de acciones por semana. Métricas de completado, bloqueantes, tendencias.

**IA:** `weekly_review` — análisis de progreso con alertas.

### Módulo H — Reportes ejecutivos

Dashboard consolidado con métricas clave, antes/después, logros y próximos pasos. Exportable.

**IA:** `executive_report` — narrativa ejecutiva generada.

### Módulo I — Asistente IA (transversal)

Componente copilot disponible en todos los módulos. Análisis contextual, sugerencias, explicaciones. No modifica datos directamente.

## Alcance MVP

### Incluido en MVP

- Autenticación con magic link.
- Gestión de organizaciones y casos.
- Módulos A-H completos con formularios y cálculos.
- Modo dual de cálculo (lean_correct + compatibility).
- Asistencia IA en todos los módulos.
- Dashboard de caso con progreso por módulo.
- Roles: admin, facilitator, participant.
- RLS y aislamiento de datos.

### Fuera del MVP (planificado)

- Google OAuth.
- Exportación a PDF/Excel.
- Modo offline / PWA.
- Plantillas de casos reutilizables.
- Benchmarking entre casos de la misma organización.
- Notificaciones por email (recordatorios de deadlines).
- Roles observer y super_admin completamente diferenciados.
- Integración con herramientas externas (Slack, Trello).
- Internacionalización (actualmente solo español).

## Factores contextuales de Venezuela

### Conectividad

- Internet inestable en muchas regiones. La aplicación debe funcionar bien en conexiones lentas.
- Server Components reducen el JS enviado al cliente.
- Optimistic updates para que la UI se sienta responsiva.

### Infraestructura empresarial

- Muchas empresas no tienen sistemas digitales. OpsFlow puede ser su primera herramienta digital.
- La UI debe ser autoexplicativa, sin requerir documentación extensa.

### Contexto económico

- Costos en USD son relevantes. Se usa tier gratuito de Supabase y Vercel.
- Los cálculos de desperdicios y costos soportan USD como moneda principal.

### Cultura organizacional

- Resistencia al cambio es un factor. El modo compatibilidad ayuda a la transición.
- Los reportes generados por IA deben usar lenguaje profesional pero accesible.
- El español es el único idioma (sin i18n en MVP).
