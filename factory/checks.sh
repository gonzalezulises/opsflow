#!/usr/bin/env bash
# The repo's checks: the steps of .github/workflows/ci.yml plus a dependency cooldown.
# The gate runs this from the main checkout inside a fresh copy of the commit. It runs
# `npm ci` itself first and sets FACTORY_GATE_INSTALLED, so node_modules is frozen while
# the job's own code (lint, tests, build) runs.
set -euo pipefail

[[ -n "${FACTORY_GATE_INSTALLED:-}" ]] || npm ci --prefer-offline --no-audit --no-fund
# Dependency cooldown: fail on any locked version under 2 days old or undated.
age_out=$(python3 ~/.agents/skills/parche-flota/scripts/edad-lock.py . 2)
echo "$age_out"
if ! grep -q '; 0 con menos de' <<<"$age_out" || grep -q 'sin fecha' <<<"$age_out"; then
  echo "dependency cooldown: young or undated versions in package-lock.json" >&2
  exit 1
fi
npm run lint
npm run typecheck
npm run test
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
  npm run build
