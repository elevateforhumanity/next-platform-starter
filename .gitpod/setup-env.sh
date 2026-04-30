#!/bin/bash
# Gitpod / Ona Flex — Environment Setup
#
# Assembles .env.local from secret chunks if present, otherwise falls back
# to .env.example. Updates NEXT_PUBLIC_SITE_URL and NEXTAUTH_URL to the
# correct preview URL for the current environment.
#
# Compatible with Ona (Gitpod Flex) and GitHub Codespaces.
# The old GITPOD_WORKSPACE_ID / GITPOD_WORKSPACE_CLUSTER_HOST variables
# are Classic-only and do not exist in Ona Flex — do not use them.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "Setting up environment..."

# ── 1. Assemble .env.local ────────────────────────────────────────────────────
if [ -f .env_local_1.txt ] && [ -f .env_local_2.txt ] && [ -f .env_local_3.txt ]; then
  cat .env_local_1.txt .env_local_2.txt .env_local_3.txt > .env.local
  echo "  Assembled .env.local from secret chunks"
elif [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    cp .env.example .env.local
    echo "  Created .env.local from .env.example (fill in values before running)"
  else
    echo "  No .env.example found — creating minimal .env.local"
    cat > .env.local << 'EOF'
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Site URL — set automatically below for Ona/Codespaces, or set manually
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000

NODE_ENV=development
EOF
  fi
else
  echo "  .env.local already exists — skipping"
fi

# ── 2. Resolve preview URL ────────────────────────────────────────────────────
PREVIEW_URL=""

# Ona / Gitpod Flex: use the gitpod CLI to get the forwarded port URL
if command -v gitpod >/dev/null 2>&1; then
  PREVIEW_URL=$(gitpod environment port open 3000 2>/dev/null | grep -oE 'https://[^ ]+' | head -1 || true)
fi

# GitHub Codespaces
if [ -z "$PREVIEW_URL" ] && [ -n "${CODESPACE_NAME:-}" ]; then
  PREVIEW_URL="https://${CODESPACE_NAME}-3000.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
fi

# Update .env.local if we resolved a URL
if [ -n "$PREVIEW_URL" ]; then
  echo "  Preview URL: $PREVIEW_URL"
  if grep -q "NEXT_PUBLIC_SITE_URL" .env.local; then
    sed -i "s|NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=$PREVIEW_URL|" .env.local
  fi
  if grep -q "NEXTAUTH_URL" .env.local; then
    sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=$PREVIEW_URL|" .env.local
  fi
  echo "  Updated NEXT_PUBLIC_SITE_URL and NEXTAUTH_URL"
else
  echo "  Could not resolve preview URL — NEXT_PUBLIC_SITE_URL left as-is"
fi

# ── 3. Validate required vars ─────────────────────────────────────────────────
echo ""
echo "Checking required variables..."
missing=0
for var in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY; do
  val=$(grep -E "^${var}=" .env.local 2>/dev/null | cut -d= -f2- || true)
  if [ -z "$val" ]; then
    echo "  WARNING: $var is not set"
    missing=$((missing + 1))
  fi
done

if [ "$missing" -eq 0 ]; then
  echo "  All required variables set"
else
  echo ""
  echo "  To configure: edit .env.local and add your Supabase credentials"
  echo "  Get them from: https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/settings/api"
fi

echo ""
echo "Environment setup complete"
