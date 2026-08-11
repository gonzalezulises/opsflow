# ADR-005: RLS en Postgres frente a rol de servicio (Drizzle)

## Estado

**Aceptado (documentación + plantilla SQL).** La aplicación sigue autorizando en Server Actions con
`requireCaseInOrganization` y membresía en `organization_members`. RLS en Postgres no sustituye
eso mientras la conexión Drizzle use un rol que **bypasea** RLS (p. ej. `postgres` / service role).

## Contexto

- Supabase Auth entrega JWT al cliente; el servidor Next valida sesión y consulta Postgres con
  `DATABASE_URL` de privilegio alto.
- Activar RLS “de verdad” implica que **esa misma conexión** no sea superusuario respecto a RLS,
  o usar otra superficie (PostgREST, RPC `SECURITY DEFINER` acotadas, `SET ROLE` por request).

## Decisiones

1. **Corto plazo:** mantener defensa en código + auditoría (`audit_events`, límites de IA).
2. **Medio plazo:** si se expone PostgREST o lecturas directas con `@supabase/supabase-js` al
   cliente, definir políticas por tabla y rol `authenticated` alineadas con `auth.uid()`.
3. **Servicio Drizzle:** seguir para mutaciones complejas; no forzar RLS en esa ruta hasta tener
   modelo de roles Postgres y pruebas de regresión.

## Consecuencias

- Duplicación posible de reglas (código + políticas) si se añade PostgREST sin diseño; minimizar
  superficie pública.
- Plantilla de políticas comentada: `docs/sql/005_rls_policies_template.sql`.

## Referencias

- `docs/RLS_STRATEGY.md`
- `docs/sql/README.md`
