# Observabilidad

## `x-request-id`

- El **proxy** (`src/proxy.ts` → `updateSession`) genera un UUID por petición.
- Se devuelve en la cabecera de **respuesta** `x-request-id` y se reinyecta en la cabecera de
  **petición** interna (`NextResponse.next({ request: { headers } })`) para que Server Actions y
  Server Components puedan leerla con `headers().get('x-request-id')` en Next 16.

## Logs JSON

- `src/lib/server-log.ts` → `logServerJson(level, event, fields)` escribe **una línea JSON** por
  evento (`ts`, `level`, `event`, `requestId` si existe, …). Uso actual: límites de IA y fallos de
  generación en `src/server/actions/ai.ts`.
- En Vercel, filtrar por texto del `event` (p. ej. `ai.generate.failed`) o ingestar stdout a Datadog
  / Axiom / etc.

## Datos de dominio

- Tabla **`ai_interactions`**: `success`, `error_message`, join con `cases` para agregar por
  `organization_id` (circuit breaker / cuotas por org).

## Próximos pasos

- Propagar `logServerJson` a mutaciones críticas (invitaciones, cambio de org).
- OpenTelemetry trace id alineado con `requestId` si pasáis a instrumentación distribuida.
