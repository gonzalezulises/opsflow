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

### Implementación

- El rol se almacena en `organization_members.role`, no en el JWT.
- Cada Server Action verifica el rol del usuario antes de ejecutar.
- La verificación es server-side; el cliente solo recibe la UI filtrada por rol.

## Row Level Security (RLS)

- **Todas** las tablas con datos de negocio tienen RLS habilitado.
- Las políticas filtran por `organization_id` basándose en la membresía del usuario.
- RLS actúa como defensa en profundidad: incluso si el código de aplicación tiene un bug, la base de datos bloquea el acceso cruzado.

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

| Scope | Límite | Implementación |
|-------|--------|----------------|
| Por usuario | 10 req/min | Contador en DB con ventana deslizante |
| Por organización | 100 req/hora | Contador en DB con ventana deslizante |
| Global | Circuit breaker | Se desactiva IA si error rate > 50% en últimos 5 min |

Si se excede el límite, se retorna HTTP 429 con `Retry-After` header.

## Audit logging

Se registran en la tabla `audit_log`:
- Creación, modificación y eliminación de registros críticos.
- Invocaciones de IA (con hash de input/output, no contenido completo).
- Cambios de roles y membresías.
- Intentos de acceso denegado.

Campos: `id`, `user_id`, `organization_id`, `action`, `entity_type`, `entity_id`, `metadata`, `ip_address`, `created_at`.

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
