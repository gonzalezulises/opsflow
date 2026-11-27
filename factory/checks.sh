#!/usr/bin/env bash
# The repo's checks: the steps of .github/workflows/ci.yml.
# The gate runs this inside a fresh copy of the commit (no .git). It runs `npm ci` itself
# first and sets FACTORY_GATE_INSTALLED, so node_modules is frozen while the job's own code
# (lint, tests, build) runs. The 2-day dependency cooldown runs in the factory, before this.
set -euo pipefail

[[ -n "${FACTORY_GATE_INSTALLED:-}" ]] || npm ci --prefer-offline --no-audit --no-fund
npm run lint
npm run typecheck
npm run test
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
  npm run build
