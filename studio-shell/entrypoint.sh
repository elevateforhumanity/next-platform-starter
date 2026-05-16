#!/bin/bash
# entrypoint.sh — clone repo then start the PTY shell server
#
# Required env vars (injected by ECS task definition via SSM):
#   GITHUB_TOKEN   — PAT with repo read access (for clone + pull)
#   GITHUB_REPO    — e.g. elevateforhumanity/Elevate-lms
#   SHELL_SECRET   — shared secret validated by the Next.js proxy
#
# Optional:
#   SHELL_PORT     — default 8888
#   WORKDIR        — default /repo
#   BRANCH         — default main

set -euo pipefail

BRANCH="${BRANCH:-main}"
REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"

echo "[entrypoint] starting — repo: ${GITHUB_REPO} branch: ${BRANCH}"

# ── Clone or update repo ──────────────────────────────────────────────────────
if [ -d "/repo/.git" ]; then
  echo "[entrypoint] repo exists — pulling latest ${BRANCH}"
  cd /repo
  git fetch origin "${BRANCH}"
  git reset --hard "origin/${BRANCH}"
else
  echo "[entrypoint] cloning ${GITHUB_REPO}"
  git clone --depth=1 --branch "${BRANCH}" "${REPO_URL}" /repo
  cd /repo
fi

# ── Install dependencies ──────────────────────────────────────────────────────
echo "[entrypoint] installing dependencies"
cd /repo
pnpm install --frozen-lockfile 2>&1 | tail -5

# ── Configure git identity for commits from the studio ───────────────────────
git config user.email "studio@elevateforhumanity.org"
git config user.name "Elevate Studio"
# Store credentials so git push works without re-prompting
git config credential.helper store
echo "https://x-access-token:${GITHUB_TOKEN}@github.com" > ~/.git-credentials

echo "[entrypoint] ready — starting shell server on :${SHELL_PORT:-8888}"

# ── Start PTY server ──────────────────────────────────────────────────────────
exec node /home/studio/studio-shell/dist/server.js
