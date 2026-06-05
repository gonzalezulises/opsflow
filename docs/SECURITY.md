# Seguridad en OpsFlow

## Autenticación

- **Proveedor:** Supabase Auth.
- **Método principal:** Magic link (email).
- **Método futuro:** Google OAuth (planificado).
- **Sesiones:** Manejadas por Supabase con refresh tokens automáticos via `@supabase/ssr`.
- **Tokens JWT:** Verificados server-side en cada request. No se confía en tokens del cliente sin verificación.

## Autorización (RBAC)

### Roles

| Rol | Nivel de acceso |
|-----|----------------|
| `super_admin` | Acceso total. Gestión de organizaciones. |
| `admin` | Gestión de usuarios y casos en su organización. |
| `facilitator` | CRUD de casos, ejecución de módulos, uso de IA. |
| `participant` | Edición de datos en casos asignados. |
| `observer` | Solo lectura. |

### Implementación (estado actual)

- El rol se almacena en la tabla `users.role` (columna `organization_id` en la misma fila).
- El middleware de Next.js exige sesión Supabase para rutas bajo `/dashboard` (y el resto de rutas no públicas).
- Las Server Actions resuelven el usuario de aplicación por **email** (coincidente con Supabase Auth) y aplican:
  - aislamiento por `organization_id` del caso,
  - bloqueo de mutaciones para rol `observer` (`src/server/auth/guards.ts`).
- El primer acceso de un correo nuevo crea automáticamente un usuario `facilitator` en la organización demo por defecto (bootstrap de bootcamp).

> **Nota:** La tabla `organization_members` del ADR-004 aún no está en el esquema Drizzle; la membresía efectiva hoy es `users.organization_id`.

## Row Level Security (RLS)

- Con la conexión actual de **Drizzle** vía `DATABASE_URL` (rol de servicio), las políticas RLS de Supabase **no sustituyen** la autorización en aplicación.
- **Defensa principal:** guards en Server Actions + autenticación obligatoria.
- Ver `docs/sql/README.md` para orientación si se habilita RLS efectiva en el futuro.

## Rutas administrativas HTTP

| Ruta | Protección |
|------|------------|
| `GET /api/migrate`, `GET /api/seed` | En **producción**, deshabilitadas (404) salvo que exista `OPSFLOW_ADMIN_API_SECRET` y la petición envíe la cabecera `x-opsflow-admin-secret` con el mismo valor. En desarrollo, abiertas si el secreto no está definido. |

## Secretos server-side

| Variable | Ubicación | Acceso |
|----------|-----------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Solo Server Actions y scripts |
| `OPENAI_API_KEY` | Server only | Solo Server Actions de IA |
| `DATABASE_URL` | Server only | Solo Drizzle ORM |
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Key anónima (limitada por RLS) |

Reglas:
- Variables sin prefijo `NEXT_PUBLIC_` nunca llegan al bundle del cliente.
- `.env` está en `.gitignore`. Se provee `.env.example` sin valores reales.
- En producción, los secretos se configuran en Vercel Environment Variables.

## Validación de inputs

- **Zod v4** valida todos los inputs en Server Actions antes de cualquier operación.
- Los schemas se definen en `src/lib/validations/` y se reutilizan en forms (client) y actions (server).
- Errores de validación retornan mensajes genéricos al usuario (sin exponer detalles internos).

## Rate limiting en endpoints de IA

**Implementado:** conteo por usuario en tabla `ai_interactions` (última hora, máx. 40 solicitudes) en `src/server/ai/rate-limit.ts`, aplicado en `getAIInsight` y `generateFromAI`.

| Scope | Límite | Implementación |
|-------|--------|----------------|
| Por usuario | 10 req/min | Contador en DB con ventana deslizante |
| Por organización | 100 req/hora | Contador en DB con ventana deslizante |
| Global | Circuit breaker | Se desactiva IA si error rate > 50% en últimos 5 min |

> Las filas de la tabla anterior describen un **objetivo** ampliado; el límite activo hoy es el del párrafo inicial.

## Audit logging

- **Casos:** creación, actualización y borrado lógico se registran en **`audit_events`** (`logAuditEvent` desde `src/server/auth/audit.ts`).
- **IA:** cada generación exitosa inserta una fila en **`ai_interactions`** (modelo, tokens, módulo).

> Ampliaciones futuras (hash de contenido, `audit_log` genérico, IP) pueden alinearse con la tabla descrita en versiones anteriores de este documento.

## Protección contra prompt injection

Múltiples capas de defensa:

1. **Separación:** Datos del usuario en bloque `<data>` delimitado, separado del system prompt.
2. **Instrucción explícita:** System prompt indica ignorar instrucciones dentro de `<data>`.
3. **Sanitización:** Remoción de delimitadores y caracteres de control en inputs.
4. **Validación de output:** Respuesta de IA se valida contra schema Zod. Respuestas malformadas se rechazan.
5. **No ejecución:** La IA no tiene capacidad de ejecutar acciones. Solo genera texto estructurado.

## Prácticas generales

- **HTTPS everywhere:** Vercel provee TLS automático.
- **CSP headers:** Configurados en `next.config.ts` para prevenir XSS.
- **No client-side secrets:** Solo `NEXT_PUBLIC_` vars llegan al cliente, y estas son seguras por diseño (anon key protegida por RLS).
- **Queries parametrizadas:** Drizzle ORM genera queries parametrizadas. No se concatenan strings en queries SQL.
- **Dependencias:** Se revisan periódicamente con `npm audit`.
