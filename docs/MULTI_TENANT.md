# Multi-tenant (producción)

OpsFlow aísla datos por **organización** (`organization_id` en casos y entidades relacionadas). El contexto activo sale de `organization_members` y la cookie httpOnly `opsflow-active-org-id`.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `OPSFLOW_STRICT_TENANCY` | Si es `true`, los usuarios nuevos **no** se añaden automáticamente a la org demo; deben **aceptar una invitación** o ser creados por un admin de plataforma. |
| `OPSFLOW_PLATFORM_ADMIN_EMAILS` | Lista separada por comas (minúsculas) de correos que pueden **crear organizaciones** (`/organization/new`) sin pertenecer antes a un tenant. |
| `APP_URL` | Base URL usada en enlaces de invitación (ej. `https://app.tudominio.com`). |
| `RESEND_API_KEY` | Opcional. Si está definida junto con `RESEND_FROM_EMAIL`, al crear una invitación se envía el enlace por correo vía [Resend](https://resend.com). |
| `RESEND_FROM_EMAIL` | Remitente verificado, p. ej. `OpsFlow <notificaciones@tudominio.com>` o el sandbox `onboarding@resend.dev`. |

## Producción (Supabase / Postgres)

1. Asegura `DATABASE_URL` apunta al proyecto de producción.
2. Ejecuta `npm run db:push` (o `drizzle-kit push`) desde CI o tu máquina para alinear tablas con `src/server/db/schema.ts` (`organization_invites`, `organization_members`, `case_assignments`, columnas nuevas en `ai_interactions`, etc.). **Con Supabase pooler (:6543)** definí también `DATABASE_URL_DIRECT` (puerto **5432**) para evitar fallos de introspección; ver `docs/DATABASE.md`.
3. Si no usas Drizzle push, aplica los scripts SQL versionados en `docs/sql/` en orden.

## Flujos

1. **Admin de plataforma** (email en `OPSFLOW_PLATFORM_ADMIN_EMAILS`): crea org en `/organization/new` → queda como **admin** del tenant y cookie activa.
2. **Admin / facilitador** del tenant: en Configuración → Miembros crea **invitación** → si `RESEND_API_KEY` está configurada, el destinatario recibe el enlace por **correo**; en cualquier caso puedes copiar el enlace `/invite/<token>`.
3. **Invitado**: abre el enlace, inicia sesión con el **mismo correo** que la invitación, acepta → se crea `organization_members` y la cookie apunta al tenant.

## Row Level Security (Postgres)

La app usa Drizzle con `DATABASE_URL` (rol de servicio). Las políticas RLS de Supabase **no** se aplican solas a esa conexión. La defensa principal sigue siendo el **código** (`requireCaseInOrganization`, etc.). Estrategia y opciones futuras: `docs/RLS_STRATEGY.md` y `docs/sql/README.md`.

## SQL manual

- `003_organization_invites.sql` — tabla de invitaciones si no usas solo `drizzle-kit push`.
