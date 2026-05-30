#!/bin/bash
# entrypoint.sh - start PTY shell server and initialize the mounted repo.
#
# The HTTP server starts immediately so the container can expose diagnostics, but
# /health only reports ready after Git, the repo clone, and pnpm install succeed.

set -uo pipefail

READY_FILE="${STUDIO_READY_FILE:-/tmp/studio-ready}"
STATUS_FILE="${STUDIO_STATUS_FILE:-/tmp/studio-setup-status}"
BRANCH="${BRANCH:-main}"
GITHUB_REPO="${GITHUB_REPO:-elevate-for-humanity/Elevate-lms}"
WORKDIR="${WORKDIR:-/repo}"

echo "starting" > "$STATUS_FILE"
rm -f "$READY_FILE"

echo "[entrypoint] starting shell server on :${SHELL_PORT:-8888}"
node /home/studio/studio-shell/dist/server.js &
SERVER_PID=$!

(
  set -e

  echo "checking tools" > "$STATUS_FILE"
  command -v git >/dev/null
  command -v pnpm >/dev/null
  command -v psql >/dev/null

  if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "missing GITHUB_TOKEN" > "$STATUS_FILE"
    echo "[entrypoint] GITHUB_TOKEN is required to clone ${GITHUB_REPO}" >&2
    exit 1
  fi

  echo "cloning ${GITHUB_REPO}@${BRANCH}" > "$STATUS_FILE"
  REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"

  if [ -d "${WORKDIR}/.git" ]; then
    cd "$WORKDIR"
    git fetch origin "$BRANCH" 2>&1
    git reset --hard "origin/${BRANCH}" 2>&1
  else
    mkdir -p "$WORKDIR"
    find "$WORKDIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
    git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$WORKDIR" 2>&1
    cd "$WORKDIR"
  fi

  git config user.email "studio@elevateforhumanity.org"
  git config user.name "Elevate Studio"
  git config credential.helper store
  printf 'https://x-access-token:%s@github.com\n' "$GITHUB_TOKEN" > ~/.git-credentials
  chmod 600 ~/.git-credentials

  echo "installing dependencies" > "$STATUS_FILE"
  cd "$WORKDIR"
  pnpm install --frozen-lockfile 2>&1 | tail -10

  echo "ready" > "$STATUS_FILE"
  touch "$READY_FILE"
  echo "[entrypoint] repo ready"
) &
SETUP_PID=$!

wait $SERVER_PID
kill "$SETUP_PID" 2>/dev/null || true
