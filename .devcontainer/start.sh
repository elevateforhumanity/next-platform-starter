#!/usr/bin/env bash
# .devcontainer/start.sh
#
# Runs automatically on every container start via postStartCommand.
# Works on GitHub Codespaces, local Docker, and any Dev Container host.
# No dependency on Gitpod/Ona.
#
# Order:
#   1. Assemble .env.local from secret chunks (or fall back to .env.example)
#   2. Install / update pnpm dependencies
#   3. Generate HVAC audio (skips if OPENAI_API_KEY not set or files exist)
#   4. Generate HVAC videos (skips if DID_API_KEY not set or files exist)
#   5. Start Next.js dev server on port 3000

set -e
cd "$(dirname "$0")/.."

# ── 1. Environment ────────────────────────────────────────────────────────────
echo "▶ Setting up environment..."
if [ -f .env_local_1.txt ] && [ -f .env_local_2.txt ] && [ -f .env_local_3.txt ]; then
  cat .env_local_1.txt .env_local_2.txt .env_local_3.txt > .env.local
  echo "  Assembled .env.local from secret chunks"
elif [ ! -f .env.local ] && [ -f .env.example ]; then
  cp .env.example .env.local
  echo "  Created .env.local from .env.example (fill in values before running)"
else
  echo "  .env.local already exists — skipping"
fi

# Load env so subsequent steps can read keys
set -a
# shellcheck disable=SC1091
[ -f .env.local ] && source .env.local
set +a

# ── 2. Dependencies ───────────────────────────────────────────────────────────
echo "▶ Installing dependencies..."
corepack enable 2>/dev/null || true
corepack prepare pnpm@10.28.2 --activate 2>/dev/null || true
pnpm install --frozen-lockfile 2>/dev/null || pnpm install --no-frozen-lockfile

# ── 3. HVAC audio (optional) ─────────────────────────────────────────────────
if [ -z "$OPENAI_API_KEY" ]; then
  echo "▶ OPENAI_API_KEY not set — skipping HVAC audio generation"
else
  echo "▶ Generating HVAC audio (skips existing files)..."
  npx tsx scripts/generate-hvac-audio.ts || echo "  Audio generation failed — continuing"
fi

# ── 4. HVAC videos (optional) ────────────────────────────────────────────────
if [ -z "$DID_API_KEY" ]; then
  echo "▶ DID_API_KEY not set — skipping HVAC video generation"
else
  echo "▶ Generating HVAC videos (skips existing files)..."
  npx tsx scripts/generate-hvac-videos-did.ts || echo "  Video generation failed — continuing"
fi

# ── 5. Dev server ─────────────────────────────────────────────────────────────
echo "▶ Starting Next.js dev server on port 3000..."
exec pnpm next dev --turbopack
