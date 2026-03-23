# Modelo de datos de OpsFlow

## Diagrama ER

```
┌──────────────────┐       ┌───────────────────────┐
│   organizations  │       │     auth.users         │
│──────────────────│       │ (Supabase managed)     │
│ id (PK)          │       │───────────────────────│
│ name             │       │ id (PK)               │
│ slug             │       │ email                 │
│ settings (jsonb) │       │ ...                   │
│ created_at       │       └──────────┬────────────┘
│ updated_at       │                  │
└────────┬─────────┘                  │
         │                            │
         │    ┌───────────────────────┼──────────┐
         │    │  organization_members │          │
         │    │──────────────────────────────────│
         └────┤ organization_id (FK)             │
              │ user_id (FK)                     │
              │ role (enum)                      │
              │ invited_at                       │
              │ joined_at                        │
              └──────────────┬───────────────────┘
                             │
                    ┌────────┴─────────┐
                    │      cases       │
                    │──────────────────│
                    │ id (PK)          │
                    │ organization_id  │──→ organizations
                    │ created_by       │──→ auth.users
                    │ title            │
                    │ description      │
                    │ company_name     │
                    │ sector           │
                    │ calculation_mode │
                    │ status (enum)    │
                    │ created_at       │
                    │ updated_at       │
                    └────────┬─────────┘
                             │
         ┌───────────────────┼───────────────────────────────┐
         │                   │                               │
         ▼                   ▼                               ▼
┌──────────────────┐ ┌────────────────┐          ┌───────────────────┐
│  diagnostic_     │ │  vsm_maps      │          │  case_members     │
│  responses       │ │────────────────│          │───────────────────│
│──────────────────│ │ id (PK)        │          │ case_id (FK)      │
│ id (PK)          │ │ case_id (FK)   │          │ user_id (FK)      │
│ case_id (FK)     │ │ name           │          │ role (enum)       │
│ category         │ │ type (enum)    │          │ assigned_at       │
│ question_key     │ │ takt_time      │          └───────────────────┘
│ score            │ │ created_at     │
│ notes            │ │ updated_at     │
│ created_at       │ └───────┬────────┘
└──────────────────┘         │
                             ▼
                    ┌────────────────────┐
                    │  vsm_steps         │
                    │────────────────────│
                    │ id (PK)            │
                    │ map_id (FK)        │
                    │ name               │
                    │ order_index        │
                    │ process_time       │
                    │ wait_time          │
                    │ transport_time     │
                    │ operators          │
                    │ defect_rate        │
                    │ activity_type      │
                    │ created_at         │
                    └────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│  risks           │  │  wastes          │  │  improvements        │
│──────────────────│  │──────────────────│  │──────────────────────│
│ id (PK)          │  │ id (PK)          │  │ id (PK)              │
│ case_id (FK)     │  │ case_id (FK)     │  │ case_id (FK)         │
│ description      │  │ type (enum)      │  │ title                │
│ category         │  │ description      │  │ description          │
│ probability      │  │ frequency (enum) │  │ impact_score         │
│ impact           │  │ estimated_cost   │  │ feasibility_score    │
│ severity (calc)  │  │ affected_step_id │  │ priority_score (calc)│
│ mitigation       │  │ root_cause       │  │ status (enum)        │
│ status (enum)    │  │ created_at       │  │ assigned_to          │
│ created_at       │  └──────────────────┘  │ deadline             │
└──────────────────┘                        │ created_at           │
                                            │ updated_at           │
                                            └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  action_plans        │  │  weekly_trackings     │
│──────────────────────│  │──────────────────────│
│ id (PK)              │  │ id (PK)              │
│ case_id (FK)         │  │ case_id (FK)         │
│ improvement_id (FK)  │  │ week_number          │
│ action               │  │ planned_actions      │
│ responsible          │  │ completed_actions    │
│ deadline             │  │ blockers             │
│ resources            │  │ notes                │
│ kpi                  │  │ metrics (jsonb)      │
│ status (enum)        │  │ created_at           │
│ completed_at         │  └──────────────────────┘
│ created_at           │
└──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│  ai_audit_log        │  │  audit_log           │
│──────────────────────│  │──────────────────────│
│ id (PK)              │  │ id (PK)              │
│ user_id (FK)         │  │ user_id (FK)         │
│ organization_id (FK) │  │ organization_id (FK) │
│ case_id (FK)         │  │ action               │
│ action_type (enum)   │  │ entity_type          │
│ input_hash           │  │ entity_id            │
│ output_hash          │  │ metadata (jsonb)     │
│ tokens_used          │  │ ip_address           │
│ latency_ms           │  │ created_at           │
│ model                │  └──────────────────────┘
│ created_at           │
└──────────────────────┘
```

## Tablas

### `organizations`

Entidad raíz del multi-tenancy. Cada organización agrupa usuarios y casos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `name` | `text` | Nombre de la organización |
| `slug` | `text` UNIQUE | Slug para URLs |
| `settings` | `jsonb` | Configuración (límites IA, modo cálculo default) |
| `created_at` | `timestamptz` | Fecha de creación |
| `updated_at` | `timestamptz` | Última modificación |

### `organization_members`

Relación many-to-many entre usuarios y organizaciones, con rol.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `organization_id` | `uuid` FK | Referencia a organizations |
| `user_id` | `uuid` FK | Referencia a auth.users |
| `role` | `member_role` | Rol del usuario en esta organización |
| `invited_at` | `timestamptz` | Fecha de invitación |
| `joined_at` | `timestamptz` | Fecha en que aceptó |

PK compuesta: (`organization_id`, `user_id`).

### `cases`

Un caso representa un proyecto de optimización operacional completo.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `organization_id` | `uuid` FK | Organización propietaria |
| `created_by` | `uuid` FK | Usuario que creó el caso |
| `title` | `text` | Título del caso |
| `description` | `text` | Descripción del proceso a optimizar |
| `company_name` | `text` | Empresa analizada |
| `sector` | `text` | Sector industrial |
| `calculation_mode` | `calculation_mode` | Modo de cálculo activo |
| `status` | `case_status` | Estado del caso |
| `created_at` | `timestamptz` | Fecha de creación |
| `updated_at` | `timestamptz` | Última modificación |

### `case_members`

Asignación de usuarios a casos específicos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `case_id` | `uuid` FK | Referencia a cases |
| `user_id` | `uuid` FK | Referencia a auth.users |
| `role` | `case_role` | Rol en este caso |
| `assigned_at` | `timestamptz` | Fecha de asignación |

### `diagnostic_responses`

Respuestas al diagnóstico operacional (Módulo A).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `case_id` | `uuid` FK | Caso asociado |
| `category` | `text` | Categoría del diagnóstico |
| `question_key` | `text` | Identificador de la pregunta |
| `score` | `integer` | Puntuación (1-5) |
| `notes` | `text` | Notas adicionales |
| `created_at` | `timestamptz` | Fecha de creación |

### `vsm_maps`

Mapas de flujo de valor (Módulo B).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `case_id` | `uuid` FK | Caso asociado |
| `name` | `text` | Nombre del mapa |
| `type` | `vsm_type` | Estado actual o futuro |
| `takt_time` | `numeric` | Takt time en minutos |
| `created_at` | `timestamptz` | Fecha de creación |
| `updated_at` | `timestamptz` | Última modificación |

### `vsm_steps`

Pasos individuales dentro de un mapa de valor.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `map_id` | `uuid` FK | Mapa asociado |
| `name` | `text` | Nombre del paso |
| `order_index` | `integer` | Posición en el flujo |
| `process_time` | `numeric` | Tiempo de proceso (minutos) |
| `wait_time` | `numeric` | Tiempo de espera (minutos) |
| `transport_time` | `numeric` | Tiempo de transporte (minutos) |
| `operators` | `integer` | Número de operadores |
| `defect_rate` | `numeric` | Tasa de defectos (0-1) |
| `activity_type` | `activity_type` | Clasificación VA/NVA/NNVA |
| `created_at` | `timestamptz` | Fecha de creación |

### `risks`

Riesgos identificados en el proceso (Módulo C).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `case_id` | `uuid` FK | Caso asociado |
| `description` | `text` | Descripción del riesgo |
| `category` | `text` | Categoría del riesgo |
| `probability` | `integer` | Probabilidad (1-5) |
| `impact` | `integer` | Impacto (1-5) |
| `severity` | `integer` | Calculado: probability * impact |
| `mitigation` | `text` | Plan de mitigación |
| `status` | `risk_status` | Estado del riesgo |
| `created_at` | `timestamptz` | Fecha de creación |

### `wastes`

Desperdicios identificados (Módulo D). Los 8 desperdicios de Lean.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `case_id` | `uuid` FK | Caso asociado |
| `type` | `waste_type` | Tipo de desperdicio (TIMWOODS) |
| `description` | `text` | Descripción específica |
| `frequency` | `frequency` | Frecuencia de ocurrencia |
| `estimated_cost` | `numeric` | Costo estimado mensual |
| `affected_step_id` | `uuid` FK nullable | Paso VSM afectado |
| `root_cause` | `text` | Causa raíz |
| `created_at` | `timestamptz` | Fecha de creación |

### `improvements`

Mejoras propuestas y su priorización (Módulo E).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `case_id` | `uuid` FK | Caso asociado |
| `title` | `text` | Título de la mejora |
| `description` | `text` | Descripción detallada |
| `impact_score` | `integer` | Score de impacto (1-10) |
| `feasibility_score` | `integer` | Score de factibilidad (1-10) |
| `priority_score` | `integer` | Calculado: impact * feasibility |
| `status` | `improvement_status` | Estado de la mejora |
| `assigned_to` | `uuid` FK nullable | Responsable |
| `deadline` | `date` | Fecha límite |
| `created_at` | `timestamptz` | Fecha de creación |
| `updated_at` | `timestamptz` | Última modificación |

### `action_plans`

Acciones concretas derivadas de mejoras (Módulo F).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `case_id` | `uuid` FK | Caso asociado |
| `improvement_id` | `uuid` FK | Mejora asociada |
| `action` | `text` | Descripción de la acción |
| `responsible` | `text` | Responsable |
| `deadline` | `date` | Fecha límite |
| `resources` | `text` | Recursos necesarios |
| `kpi` | `text` | KPI de seguimiento |
| `status` | `action_status` | Estado de la acción |
| `completed_at` | `timestamptz` | Fecha de completado |
| `created_at` | `timestamptz` | Fecha de creación |

### `weekly_trackings`

Seguimiento semanal del progreso (Módulo G).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `case_id` | `uuid` FK | Caso asociado |
| `week_number` | `integer` | Número de semana |
| `planned_actions` | `integer` | Acciones planificadas |
| `completed_actions` | `integer` | Acciones completadas |
| `blockers` | `text` | Bloqueantes identificados |
| `notes` | `text` | Notas de la semana |
| `metrics` | `jsonb` | Métricas variables por semana |
| `created_at` | `timestamptz` | Fecha de creación |

### `ai_audit_log`

Registro de todas las invocaciones de IA.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `user_id` | `uuid` FK | Usuario que invocó |
| `organization_id` | `uuid` FK | Organización |
| `case_id` | `uuid` FK | Caso asociado |
| `action_type` | `ai_action_type` | Tipo de análisis |
| `input_hash` | `text` | Hash SHA-256 del input |
| `output_hash` | `text` | Hash SHA-256 del output |
| `tokens_used` | `integer` | Tokens consumidos |
| `latency_ms` | `integer` | Latencia en milisegundos |
| `model` | `text` | Modelo utilizado |
| `created_at` | `timestamptz` | Fecha de creación |

### `audit_log`

Registro general de acciones del sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | `uuid` PK | Identificador único |
| `user_id` | `uuid` FK | Usuario que ejecutó la acción |
| `organization_id` | `uuid` FK | Organización |
| `action` | `text` | Acción ejecutada |
| `entity_type` | `text` | Tipo de entidad afectada |
| `entity_id` | `uuid` | ID de la entidad afectada |
| `metadata` | `jsonb` | Datos adicionales |
| `ip_address` | `inet` | Dirección IP |
| `created_at` | `timestamptz` | Fecha de creación |

## Enums

### `member_role`

```sql
CREATE TYPE member_role AS ENUM (
  'super_admin',
  'admin',
  'facilitator',
  'participant',
  'observer'
);
```

### `case_status`

```sql
CREATE TYPE case_status AS ENUM (
  'draft',
  'in_progress',
  'completed',
  'archived'
);
```

### `case_role`

```sql
CREATE TYPE case_role AS ENUM (
  'lead',
  'member',
  'observer'
);
```

### `calculation_mode`

```sql
CREATE TYPE calculation_mode AS ENUM (
  'lean_correct',
  'compatibility'
);
```

### `vsm_type`

```sql
CREATE TYPE vsm_type AS ENUM (
  'current_state',
  'future_state'
);
```

### `activity_type`

```sql
CREATE TYPE activity_type AS ENUM (
  'value_add',
  'non_value_add',
  'necessary_non_value_add'
);
```

### `risk_status`

```sql
CREATE TYPE risk_status AS ENUM (
  'identified',
  'mitigating',
  'mitigated',
  'accepted',
  'closed'
);
```

### `waste_type`

Los 8 desperdicios de Lean (TIMWOODS):

```sql
CREATE TYPE waste_type AS ENUM (
  'transport',
  'inventory',
  'motion',
  'waiting',
  'overproduction',
  'overprocessing',
  'defects',
  'skills_underuse'
);
```

### `frequency`

```sql
CREATE TYPE frequency AS ENUM (
  'rare',
  'occasional',
  'frequent',
  'constant'
);
```

### `improvement_status`

```sql
CREATE TYPE improvement_status AS ENUM (
  'proposed',
  'approved',
  'in_progress',
  'completed',
  'rejected'
);
```

### `action_status`

```sql
CREATE TYPE action_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled',
  'overdue'
);
```

### `ai_action_type`

```sql
CREATE TYPE ai_action_type AS ENUM (
  'diagnostico_summary',
  'vsm_analysis',
  'risk_recommendations',
  'waste_cost_explanation',
  'prioritization_review',
  'action_plan_suggestions',
  'weekly_review',
  'executive_report'
);
```
