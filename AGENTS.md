<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

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
- `/factory run` procesa los issues con label `factory`: intake → spec → builder (Claude) → gate → revisión (Codex) → approver (Codex) → política de merge.
- La política (`factory/lib/policy.py`) decide el merge, no un modelo: clase A o B, gate y prueba de aceptación sobre el commit exacto, revisiones y aprobación del mismo diff. Las clases C (rutas sensibles de `factory/config.json`, dependencias nuevas o versión mayor) y D (fábrica, CI, agentes) van a Ulises con label `factory:needs-human`.
- El gate prueba una copia limpia del commit, fuera del repo y sin credenciales: cooldown de 2 días de dependencias, `factory/checks.sh` (lo mismo que `.github/workflows/ci.yml`) y pruebas del cambio que fallen sin él y pasen con él. Si cambia el CI, cambia también `checks.sh`.
- Cada job trabaja en su propio clon, `.worktrees/<issue>/`, y su estado vive en `factory/jobs/<issue>/` (ambos ignorados por git, ESLint, tsc y Vitest). Solo `factory/bin/factory` hace push y habla con GitHub.
- Preparar un clon: `npm ci`; las variables están en `.env.example` (el build basta con los placeholders de `factory/checks.sh`). Servidor en el puerto asignado: `npm run dev -- -p <port>`.
- Sin nadie delante: `factory/bin/run` (un `claude -p "/factory run"` a la vez, solo si la variable del repo `FACTORY_RUNNER` es `mac`).
