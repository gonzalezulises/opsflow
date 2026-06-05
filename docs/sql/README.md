# Row Level Security (referencia)

Las conexiones de OpsFlow a Postgres vía `DATABASE_URL` (Drizzle) suelen usar el rol
`postgres` o un usuario de servicio, por lo que **las políticas RLS de Supabase no se
aplican automáticamente** salvo que la conexión use un rol sujeto a RLS y `auth.uid()`.

**Defensa en profundidad actual:** autorización en Server Actions (`src/server/auth/guards.ts`)
filtrando por `organization_id` y rol de aplicación.

Para activar RLS de forma efectiva en el futuro, opciones típicas:

1. **PostgREST / Supabase client** con JWT de usuario para lecturas sensibles.
2. **Conexión con rol `authenticated`** y `SET request.jwt.claim.sub` (avanzado).
3. **Políticas documentadas** y pruebas de penetración sobre la API pública.

Este directorio puede alojar migraciones SQL manuales (`*.sql`) coordinadas con el equipo
de base de datos; no sustituyen a `drizzle-kit` para el esquema Drizzle.

- `002_organization_members.sql` — tablas `organization_members` y `case_assignments` + backfill desde `users` (idempotente).
- `003_organization_invites.sql` — tabla `organization_invites` para onboarding multi-tenant.
