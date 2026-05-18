#!/usr/bin/env bash
# .devcontainer/setup-env.sh
#
# Assembles .env.local from secret chunk files on container start.
# Secrets are managed via the admin dashboard (platform_secrets table)
# and loaded at runtime by lib/secrets.ts — not from .env.local.

set -e
cd "$(dirname "$0")/.."

echo "▶ Setting up environment..."

if [ -f .env_local_1.txt ] && [ -f .env_local_2.txt ] && [ -f .env_local_3.txt ]; then
  cat .env_local_1.txt .env_local_2.txt .env_local_3.txt > .env.local
  echo "  Assembled .env.local from secret chunks"
elif [ ! -f .env.local ] && [ -f .env.example ]; then
  cp .env.example .env.local
  echo "  Created .env.local from .env.example"
elif [ -f .env.local ]; then
  echo "  .env.local already exists — skipping"
else
  echo "  ⚠️  No secret source found — create .env.local manually"
fi

echo "  Done"
echo ""
echo "  To start the dev server:"
echo "    pnpm dev                      # LMS app   → http://localhost:3000"
echo "    cd apps/admin && pnpm dev     # Admin app → http://localhost:3001"
