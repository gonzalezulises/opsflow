# OpsFlow — Optimización Operativa Inteligente

Plataforma web de diagnóstico, análisis y mejora continua de procesos operativos, contextualizada para Latinoamérica. Transforma un toolkit Excel estático en un workflow guiado, multiusuario, auditable y asistido por IA.

## Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Server Actions, Drizzle ORM
- **Base de datos**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (magic link)
- **IA**: OpenAI API con structured outputs
- **Testing**: Vitest (unit), Playwright (E2E planificado)
- **CI/CD**: GitHub Actions + Vercel

## Inicio rápido

```bash
# Clonar e instalar
git clone https://github.com/gonzalezulises/opsflow.git
cd opsflow
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Crear tablas en Supabase
npm run db:push

# Seed del caso base
npm run db:seed

# Desarrollo
npm run dev
```

## Módulos

| # | Módulo | Descripción |
|---|--------|-------------|
| 1 | Contexto del caso | Empresa, sector, proceso, métricas base |
| 2 | Diagnóstico de madurez | 15 preguntas, escala 1-5, nivel bajo/medio/alto |
| 3 | VSM | Mapeo de flujo de valor con eficiencia de flujo |
| 4 | Riesgo contextual | Matriz probabilidad × impacto |
| 5 | Costo del desperdicio | Cuantificación de fugas económicas |
| 6 | Priorización | Matriz ponderada de iniciativas |
| 7 | Plan de 30 días | Acciones, responsables, métricas, contingencias |
| 8 | Seguimiento semanal | Métricas, tendencias, alertas |
| 9 | Reporte ejecutivo | Resumen consolidado exportable |

## Caso base incluido

**Alimentos Santa Emilia, C.A.** — Sector alimentos y consumo masivo, proceso pedido a despacho.
- 210 pedidos semanales, ticket promedio $480 USD
- Lead time actual: 6.8 días, OTD/OTIF: 62%
- 6 pasos VSM, 6 riesgos contextuales, 4 fugas de desperdicio, 5 iniciativas

## Modos de cálculo VSM

- **lean_correct** (default): tiempo de valor = solo pasos que agregan valor
- **compatibility**: replica la lógica del Excel original

## Asistencia IA

Panel lateral por módulo con acciones como:
- Explicar resultados
- Resumir hallazgos
- Detectar inconsistencias
- Sugerir mejoras y quick wins
- Generar reporte ejecutivo

Todas las salidas usan structured outputs con schemas Zod.

## Scripts

```bash
npm run dev          # Desarrollo local
npm run build        # Build de producción
npm run lint         # ESLint
npm run typecheck    # TypeScript
npm run test         # Tests unitarios
npm run db:push      # Push schema a Supabase
npm run db:generate  # Generar migraciones
npm run db:migrate   # Aplicar migraciones
npm run db:seed      # Seed del caso base
npm run db:studio    # Drizzle Studio
```

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Modelo de datos](docs/DATA_MODEL.md)
- [Diseño de IA](docs/AI_DESIGN.md)
- [Seguridad](docs/SECURITY.md)
- [Alcance del producto](docs/PRODUCT_SCOPE.md)
- [Guía de despliegue](docs/DEPLOY.md)
- [Testing](docs/TESTING.md)
- ADRs en [docs/adr/](docs/adr/)

## Estructura del proyecto

```
src/
├── app/                    # Rutas Next.js (App Router)
│   ├── (app)/             # Rutas autenticadas
│   │   └── dashboard/     # Dashboard, casos, equipo, settings
│   ├── (public)/          # Landing, login
│   └── auth/              # Callback de auth
├── components/
│   ├── layout/            # Sidebar, theme provider
│   ├── shared/            # AI panel, componentes compartidos
│   └── ui/                # shadcn/ui components
├── features/              # Módulos por dominio
│   ├── auth/
│   ├── cases/
│   ├── diagnostic/
│   ├── vsm/
│   ├── risks/
│   ├── waste/
│   ├── prioritization/
│   ├── plan/
│   ├── tracking/
│   └── reports/
├── hooks/                 # Custom hooks
├── lib/
│   ├── calculations/      # Motor de cálculos
│   ├── constants/         # Definiciones de módulos
│   └── supabase/          # Clientes Supabase
└── server/
    ├── actions/           # Server actions
    ├── ai/                # Cliente OpenAI, schemas, prompts
    └── db/                # Drizzle schema, seeds, migraciones
```

## Licencia

Privado. Uso autorizado solo para bootcamps, workshops y consultoría con autorización del autor.
