<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->


# OpsFlow — Instrucciones del proyecto

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (base-ui render pattern)
- Supabase (Postgres, Auth magic link) + Drizzle ORM
- OpenAI API con structured outputs (Zod schemas)
- Vitest para tests, GitHub Actions para CI

## Convenciones
- Idioma UI: español. Código: inglés.
- Server Components por defecto, `'use client'` solo cuando necesario.
- Server Actions en `src/server/actions/` para mutaciones.
- Cálculos del dominio en `src/lib/calculations/` — nunca en componentes UI.
- Schemas de IA en `src/server/ai/schemas.ts`.
- shadcn/ui v4 usa `render` prop (base-ui) en vez de `asChild` (radix). Ejemplo: `<SheetTrigger render={<Button />}>`.
- Zod v4: usar `.issues[0].message` para errores.

## Estructura
- `src/features/` — módulos por dominio (auth, cases, diagnostic, vsm, risks, waste, prioritization, plan, tracking, reports)
- `src/server/actions/` — server actions por módulo
- `src/server/ai/` — cliente OpenAI, prompts, schemas, generate
- `src/server/db/` — Drizzle schema, seeds, migraciones
- `src/lib/calculations/` — motor de cálculos puro (sin dependencias de React/DB)
- `docs/` — documentación técnica y ADRs

## Comandos útiles
- `npm run dev` — desarrollo
- `npm run build` — build de producción
- `npm run typecheck` — verificar tipos
- `npm run test` — tests unitarios
- `npm run db:push` — push schema a Postgres (`docs/DATABASE.md`: pooler vs directo)
- `npm run db:seed` — seed del caso base

## Caso base
Alimentos Santa Emilia, C.A. — Sector alimentos, proceso pedido a despacho.
Seed en `src/server/db/seeds/index.ts`.

## Modos VSM
- `lean_correct` (default): valor = solo pasos con addsValue=true
- `compatibility`: valor = todo el tiempo de proceso (legado Excel)

## Software factory
- `/factory run` procesa los issues con label `factory`: intake → spec → builder (Claude) → `factory/checks.sh` → revisión → aprobación → merge.
- Auditor: Codex (`factory/bin/codex-review`) revisa código y seguridad y decide APPROVE/ESCALATE. UX y UI las revisa Claude con navegador.
- Escala a Ulises (label `factory:needs-human`) solo lo que lista `.claude/agents/approver.md`; lo demás se fusiona solo.
- `factory/checks.sh` replica `.github/workflows/ci.yml`; si cambia uno, cambia el otro.
- Estado local en `factory/jobs/` y worktrees en `.worktrees/` (ignorados por git, ESLint, tsc y Vitest).
- Preparar un worktree: `npm ci`; las variables están en `.env.example` (el build basta con los placeholders de `factory/checks.sh`). Servidor en el puerto asignado: `npm run dev -- -p <port>`.
- El costo por job que muestra el dashboard es solo el de Claude; las auditorías de Codex no se cuentan.
