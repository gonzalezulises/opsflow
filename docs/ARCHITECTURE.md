# Arquitectura de OpsFlow

## Visión general

OpsFlow es una aplicación Next.js 16 con App Router que implementa una herramienta de optimización operacional para bootcamps Lean/Six Sigma. La arquitectura sigue un modelo de capas con separación clara de responsabilidades.

## Diagrama de capas

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                               │
│  Next.js App Router (RSC por defecto, 'use client' mínimo) │
│  shadcn/ui + Tailwind v4 + Recharts + TanStack Table        │
├─────────────────────────────────────────────────────────────┤
│                    SERVER ACTIONS                             │
│  Validación (Zod v4) → Lógica de negocio → Mutaciones DB   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ CRUD Actions  │  │ Calculation  │  │  AI Actions  │      │
│  │              │  │   Engine     │  │ (OpenAI SDK) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                     CAPA DE DATOS                            │
│  Drizzle ORM → PostgreSQL (Supabase)                        │
│  RLS policies + organization-scoped queries                  │
├─────────────────────────────────────────────────────────────┤
│                   INFRAESTRUCTURA                            │
│  Vercel (hosting) + Supabase (DB + Auth + Storage)          │
└─────────────────────────────────────────────────────────────┘
```

## Capas en detalle

### 1. UI (Presentación)

- **Framework:** Next.js 16 App Router con React 19.
- **Componentes:** shadcn/ui (copiados al proyecto, no como dependencia externa).
- **Estilos:** Tailwind CSS v4 con variables CSS.
- **Server Components** por defecto. `'use client'` solo para interactividad (forms, gráficas, tablas).
- **Gráficas:** Recharts para VSM, métricas y dashboards.
- **Tablas:** TanStack Table para datos tabulares con sorting/filtering.

### 2. Business Logic (Server Actions + Calculation Engine)

- **Server Actions** para todas las mutaciones. No se usan API routes salvo webhooks.
- **Calculation Engine:** Módulo puro de TypeScript que implementa todos los cálculos Lean/Six Sigma. Soporta dos modos: `lean_correct` y `compatibility` (ver ADR-002).
- **Validación:** Zod v4 en cada Server Action (input y output).

### 3. Data (Drizzle + Supabase PostgreSQL)

- **ORM:** Drizzle con queries explícitas (sin magic relations).
- **Migraciones:** Drizzle Kit para generar y aplicar migraciones SQL.
- **RLS:** Todas las tablas de negocio tienen Row Level Security habilitado.
- **Auth:** Supabase Auth con magic link.

### 4. AI (OpenAI Structured Outputs)

- **SDK:** OpenAI SDK v6+ con structured outputs.
- **Ejecución:** Exclusivamente server-side (Server Actions).
- **Schemas:** Cada tipo de análisis define un schema Zod para la respuesta.
- **Patrón:** Copilot (sugerir, nunca modificar datos directamente).

## Estructura de módulos

La aplicación se organiza en módulos funcionales que reflejan el flujo de un proyecto de optimización:

```
src/
├── app/
│   ├── (auth)/              # Login, registro, magic link
│   ├── (dashboard)/         # Layout autenticado
│   │   ├── cases/           # Gestión de casos
│   │   ├── diagnostic/      # Módulo A: Diagnóstico operacional
│   │   ├── vsm/             # Módulo B: Value Stream Mapping
│   │   ├── risks/           # Módulo C: Matriz de riesgos
│   │   ├── waste/           # Módulo D: Análisis de desperdicios
│   │   ├── prioritization/  # Módulo E: Priorización de mejoras
│   │   ├── plan/            # Módulo F: Plan de acción
│   │   ├── tracking/        # Módulo G: Seguimiento semanal
│   │   └── reports/         # Módulo H: Reportes ejecutivos
│   └── api/                 # Solo webhooks
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── modules/             # Componentes específicos por módulo
├── lib/
│   ├── db/                  # Drizzle schema, queries, migraciones
│   ├── calculations/        # Motor de cálculos Lean
│   ├── ai/                  # Prompts, schemas, client OpenAI
│   ├── auth/                # Helpers de Supabase Auth
│   └── validations/         # Schemas Zod compartidos
└── types/                   # TypeScript types globales
```

## Flujo de datos típico

```
1. Usuario navega a /vsm/[caseId]
2. Server Component carga datos via Drizzle (RLS filtra por org)
3. Se renderizan componentes UI con datos
4. Usuario edita un paso del VSM (Client Component + form)
5. Form submit → Server Action
6. Server Action: Zod valida → Drizzle actualiza → revalidatePath
7. Usuario pide análisis IA → Server Action → OpenAI → structured output
8. UI muestra sugerencia como borrador → usuario acepta/rechaza
```

## Decisiones arquitectónicas

Las decisiones clave están documentadas en ADRs:

- [ADR-001: Stack tecnológico](./adr/001-stack-selection.md)
- [ADR-002: Modos de cálculo](./adr/002-calculation-modes.md)
- [ADR-003: Arquitectura IA](./adr/003-ai-architecture.md)
- [ADR-004: Auth y roles](./adr/004-auth-and-roles.md)
