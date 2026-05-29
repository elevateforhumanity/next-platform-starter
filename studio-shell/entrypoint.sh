#!/bin/bash
# entrypoint.sh — start PTY shell server, then clone/update repo in background
#
# Boot order:
#   1. Start shell server immediately so ECS health checks pass from second 1
#   2. Clone/pull repo + pnpm install in background
#   3. Shell sessions before install completes will see an incomplete repo — acceptable

set -uo pipefail

BRANCH="${BRANCH:-main}"
REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"

echo "[entrypoint] starting shell server on :${SHELL_PORT:-8888}"

# ── Start PTY server immediately ──────────────────────────────────────────────
node /home/studio/studio-shell/dist/server.js &
SERVER_PID=$!

# ── Clone/update repo in background (does not block health checks) ────────────
(
  echo "[entrypoint] repo setup — ${GITHUB_REPO}@${BRANCH}"

  if [ -d "/repo/.git" ]; then
    cd /repo
    git fetch origin "${BRANCH}" 2>&1
    git reset --hard "origin/${BRANCH}" 2>&1
  else
    git clone --depth=1 --branch "${BRANCH}" "${REPO_URL}" /repo 2>&1
    cd /repo
  fi

  git config user.email "studio@elevateforhumanity.org"
  git config user.name "Elevate Studio"
  git config credential.helper store
  echo "https://x-access-token:${GITHUB_TOKEN}@github.com" > ~/.git-credentials

  echo "[entrypoint] installing dependencies"
  cd /repo && pnpm install --frozen-lockfile 2>&1 | tail -10
  echo "[entrypoint] repo ready"
) &

# ── Keep container alive — exit when server exits ─────────────────────────────
wait $SERVER_PID
