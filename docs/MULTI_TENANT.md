# Multi-tenant (producción)

OpsFlow aísla datos por **organización** (`organization_id` en casos y entidades relacionadas). El contexto activo sale de `organization_members` y la cookie httpOnly `opsflow-active-org-id`.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `OPSFLOW_STRICT_TENANCY` | Si es `true`, los usuarios nuevos **no** se añaden automáticamente a la org demo; deben **aceptar una invitación** o ser creados por un admin de plataforma. |
| `OPSFLOW_PLATFORM_ADMIN_EMAILS` | Lista separada por comas (minúsculas) de correos que pueden **crear organizaciones** (`/organization/new`) sin pertenecer antes a un tenant. |
| `APP_URL` | Base URL usada en enlaces de invitación (ej. `https://app.tudominio.com`). |

## Flujos

1. **Admin de plataforma** (email en `OPSFLOW_PLATFORM_ADMIN_EMAILS`): crea org en `/organization/new` → queda como **admin** del tenant y cookie activa.
2. **Admin / facilitador** del tenant: en Configuración → Miembros crea **invitación** → comparte el enlace `/invite/<token>`.
3. **Invitado**: abre el enlace, inicia sesión con el **mismo correo** que la invitación, acepta → se crea `organization_members` y la cookie apunta al tenant.

## Row Level Security (Postgres)

La app usa Drizzle con `DATABASE_URL` (rol de servicio). Las políticas RLS de Supabase **no** se aplican solas a esa conexión. La defensa principal sigue siendo el **código** (`requireCaseInOrganization`, etc.). Para RLS real hace falta otra vía (JWT por request, PostgREST, o `SET LOCAL` + políticas); ver `docs/sql/README.md`.

## SQL manual

- `003_organization_invites.sql` — tabla de invitaciones si no usas solo `drizzle-kit push`.
