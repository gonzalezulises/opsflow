# ADR-004: Autenticación y sistema de roles

**Estado:** Aceptada
**Fecha:** 2026-03-23

## Contexto

OpsFlow es multi-tenant: múltiples organizaciones usan la misma instancia. Cada bootcamp genera datos sensibles de los procesos operacionales de empresas reales. Se requiere:

- Autenticación sin fricción (los participantes de bootcamp no son técnicos).
- Roles diferenciados por permisos.
- Aislamiento de datos entre organizaciones.
- Auditoría de acciones críticas.

## Decisión

### Autenticación: Supabase Auth con magic link

- Sin contraseñas. El usuario recibe un enlace por email.
- Reduce fricción en bootcamps donde los participantes cambian frecuentemente.
- Opción futura: agregar Google OAuth como método adicional.

### Roles

Se definen 5 roles jerárquicos:

| Rol | Permisos |
|-----|----------|
| `super_admin` | Todo. Gestión de organizaciones y configuración global. |
| `admin` | Gestión de usuarios y casos dentro de su organización. |
| `facilitator` | Crear/editar casos, ejecutar módulos, usar IA, generar reportes. |
| `participant` | Editar datos en casos asignados, ver resultados de su equipo. |
| `observer` | Solo lectura. Puede ver dashboards y reportes. |

El rol se almacena en la tabla `organization_members` (no en `auth.users`), permitiendo que un usuario tenga diferentes roles en diferentes organizaciones.

### Row Level Security (RLS)

Todas las tablas con datos de negocio tienen políticas RLS:

```sql
-- Ejemplo: solo miembros de la organización pueden ver sus casos
CREATE POLICY "org_members_select_cases" ON cases
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

- `SELECT`: filtrado por organización del usuario.
- `INSERT/UPDATE`: filtrado por organización + rol mínimo requerido.
- `DELETE`: solo `admin` y `super_admin`.

### Scope organizacional

Toda query incluye implícitamente el filtro de `organization_id` mediante RLS. No es posible acceder a datos de otra organización, ni siquiera por error en el código de aplicación.

## Consecuencias

### Positivas

- Magic link elimina problemas de contraseñas olvidadas en bootcamps.
- RLS garantiza aislamiento de datos a nivel de base de datos (defensa en profundidad).
- Roles flexibles permiten el mismo usuario en múltiples organizaciones con diferentes permisos.

### Negativas

- Magic link depende de que el email llegue (puede ser lento en algunos proveedores venezolanos).
- RLS agrega complejidad a las queries y puede impactar rendimiento.
- 5 roles pueden ser excesivos para organizaciones pequeñas.

### Mitigación

- Se planifica Google OAuth como fallback para problemas de email.
- Las políticas RLS se mantienen simples (máximo 1 subquery).
- Las organizaciones pequeñas pueden usar solo `admin` + `participant`.
