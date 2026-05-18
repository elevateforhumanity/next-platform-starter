#!/usr/bin/env bash
# .devcontainer/setup-env.sh
#
# Lightweight environment bootstrap — runs on postCreateCommand and
# postStartCommand.  It only assembles .env.local; it does NOT install
# dependencies, generate media, or start the dev server.
#
# Usage:
#   bash .devcontainer/setup-env.sh   (called automatically by devcontainer.json)
#
# To start the dev server after the container is ready:
#   pnpm dev              # LMS  (port 3000)
#   cd apps/admin && pnpm dev   # Admin (port 3001)

set -e
cd "$(dirname "$0")/.."

echo "▶ Setting up environment..."

# Assemble .env.local from Codespaces secret chunks if all three are present.
# Secret chunks are set as Codespaces repository secrets named ENV_LOCAL_1,
# ENV_LOCAL_2, ENV_LOCAL_3 — they are written to .env_local_N.txt by the
# Codespaces secrets injection mechanism.
if [ -f .env_local_1.txt ] && [ -f .env_local_2.txt ] && [ -f .env_local_3.txt ]; then
  cat .env_local_1.txt .env_local_2.txt .env_local_3.txt > .env.local
  echo "  Assembled .env.local from secret chunks"
elif [ ! -f .env.local ] && [ -f .env.example ]; then
  cp .env.example .env.local
  echo "  Created .env.local from .env.example — fill in your Supabase keys before running"
elif [ -f .env.local ]; then
  echo "  .env.local already exists — skipping"
else
  echo "  No .env.example found — create .env.local manually before starting the dev server"
fi

echo "  Environment setup complete"

# Export NEXT_PUBLIC_* and other critical vars into the shell profile so that
# dev services started by Gitpod automations inherit them. This is necessary
# because devcontainer.json injects ${localEnv:VAR} as empty strings when the
# vars are not set as Gitpod secrets — empty shell env vars take precedence
# over .env.local in Next.js, causing "Supabase not configured" at runtime.
if [ -f .env.local ]; then
  PROFILE_EXPORT="$HOME/.bashrc"
  # Remove any previous block written by this script
  sed -i '/# >>> elevate-env >>>/,/# <<< elevate-env <<</d' "$PROFILE_EXPORT" 2>/dev/null || true
  {
    echo "# >>> elevate-env >>>"
    # Export all non-empty, non-comment vars from .env.local so that dev
    # services (Next.js, scripts) inherit them regardless of how the container
    # was started. Empty string exports are skipped — they would shadow secrets
    # injected by Gitpod/Codespaces and cause "not configured" errors at runtime.
    grep -E "^[A-Z_]+=.+" .env.local \
      | grep -v "^#" \
      | sed 's/^/export /'
    echo "# <<< elevate-env <<<"
  } >> "$PROFILE_EXPORT"
  echo "  Exported env vars to $PROFILE_EXPORT"
fi

echo ""
echo "  To start the dev server:"
echo "    pnpm dev                      # LMS app   → http://localhost:3000"
echo "    cd apps/admin && pnpm dev     # Admin app → http://localhost:3001"
