# ADR-003: Arquitectura de integración con IA

**Estado:** Aceptada
**Fecha:** 2026-03-23

## Contexto

OpsFlow integra IA (OpenAI) para asistir a facilitadores y participantes en el análisis operacional. Los requisitos son:

- La IA debe sugerir, nunca modificar datos directamente.
- Las respuestas deben ser estructuradas y predecibles (no texto libre arbitrario).
- La seguridad es crítica: no exponer API keys ni permitir prompt injection.
- El costo debe ser controlable (rate limiting).

## Decisión

### 1. Server-side only

Toda comunicación con OpenAI ocurre exclusivamente en Server Actions. El API key nunca llega al cliente.

```
Cliente → Server Action → OpenAI API → Respuesta estructurada → Cliente
```

### 2. Structured outputs via Zod schemas

Cada tipo de análisis define un schema Zod que se envía como `response_format` a OpenAI. Esto garantiza que la respuesta sea parseable y type-safe.

```typescript
const diagnosticoSummarySchema = z.object({
  resumen: z.string(),
  hallazgos_clave: z.array(z.string()),
  areas_criticas: z.array(z.string()),
  recomendaciones: z.array(z.string()),
  score_madurez: z.number().min(1).max(5),
});
```

### 3. Patrón copilot (sugerir, no modificar)

La IA genera sugerencias que el usuario revisa y acepta explícitamente. Nunca se escriben datos en la base directamente desde una respuesta de IA.

Flujo:
1. Usuario solicita análisis.
2. Server Action recopila contexto del caso.
3. Se envía prompt + datos a OpenAI con structured output.
4. Se muestra la sugerencia en UI como "borrador".
5. Usuario revisa, edita opcionalmente y confirma.

### 4. Rate limiting

- Máximo 10 requests por usuario por minuto.
- Máximo 100 requests por organización por hora.
- Se implementa con contadores en base de datos.

### 5. Protección contra prompt injection

- Los datos del usuario se envían en un bloque `<data>` delimitado, separado del system prompt.
- El system prompt incluye instrucciones explícitas de ignorar instrucciones dentro de los datos.
- Se sanitizan inputs antes de incluirlos en el prompt.
- Se valida la respuesta contra el schema Zod (rechazando cualquier salida inesperada).

## Consecuencias

### Positivas

- Type-safety end-to-end desde la IA hasta la UI.
- Sin riesgo de modificación silenciosa de datos.
- Costos predecibles con rate limiting.
- Protección multi-capa contra prompt injection.

### Negativas

- Latencia adicional en cada request de IA (2-5 segundos).
- Structured outputs limitan la creatividad de las respuestas.
- Rate limiting puede frustrar usuarios en sesiones intensivas de análisis.

### Mitigación

- UI muestra skeleton/loading state durante análisis.
- Los schemas son lo suficientemente flexibles para respuestas útiles.
- Los límites de rate se pueden ajustar por organización.
