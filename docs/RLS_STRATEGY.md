# RLS en Postgres vs conexión de servicio

OpsFlow usa **Drizzle** con `DATABASE_URL`, normalmente el rol `postgres` o un usuario con
privilegios elevados. En Postgres, el rol de servicio **bypasea Row Level Security** salvo
que se use `FORCE ROW LEVEL SECURITY` y un rol restringido.

## Alineación con JWT (Supabase Auth)

- **Hoy:** la app valida sesión en Next (Supabase Auth) y aplica tenant en código
  (`requireCaseInOrganization`, `organization_members`, etc.).
- **Defensa en profundidad con RLS:** requiere que las consultas sensibles no pasen por el
  rol de servicio, por ejemplo:
  1. **PostgREST** (API auto de Supabase) con políticas `auth.uid()` y tablas expuestas
     solo ahí.
  2. **Conexión con rol `authenticated`** y `SET LOCAL` de claims de JWT antes de cada
     request (patrón avanzado con pooler).
  3. **Vistas** materializadas o RPC con `SECURITY DEFINER` muy acotadas, auditadas.

## Recomendación práctica

Mantén el **servicio Drizzle** para mutaciones complejas y joins; si expones datos por
PostgREST o Edge Functions al cliente, activa RLS allí y duplica reglas de negocio lo
mínimo imprescindible (o centraliza en RPC).

Ver también `docs/sql/README.md` y **ADR-005** (`docs/adr/005-rls-postgres-strategy.md`).
