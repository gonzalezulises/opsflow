#!/usr/bin/env bash
# The repo's checks: the same steps as .github/workflows/ci.yml.
# The gate runs this from the main checkout with the job's worktree as cwd.
set -euo pipefail

npm ci --prefer-offline --no-audit --no-fund
npm run lint
npm run typecheck
npm run test
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder \
  npm run build
