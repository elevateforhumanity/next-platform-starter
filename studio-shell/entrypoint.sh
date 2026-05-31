#!/bin/bash
# Dev Studio Runtime — deps baked in image; ready in seconds after ECS start.

set -uo pipefail

READY_FILE="${STUDIO_READY_FILE:-/tmp/studio-ready}"
STATUS_FILE="${STUDIO_STATUS_FILE:-/tmp/studio-setup-status}"
BRANCH="${BRANCH:-main}"
GITHUB_REPO="${GITHUB_REPO:-elevate-for-humanity/Elevate-lms}"
WORKDIR="${WORKDIR:-/repo}"

write_status() { echo "$1" > "$STATUS_FILE"; }

write_status "starting"
rm -f "$READY_FILE"

node /home/studio/studio-shell/dist/server.js &
SERVER_PID=$!

mark_ready() {
  write_status "ready"
  touch "$READY_FILE"
  echo "[entrypoint] Dev Studio Runtime ready"
}

(
  command -v git >/dev/null || { write_status "git missing"; exit 1; }
  command -v pnpm >/dev/null || { write_status "pnpm missing"; exit 1; }

  if [ -d "${WORKDIR}/node_modules" ]; then
    write_status "preinstalled dependencies"
    mark_ready
    if [ -n "${GITHUB_TOKEN:-}" ] && [ -d "${WORKDIR}/.git" ]; then
      write_status "syncing ${BRANCH}"
      (cd "$WORKDIR" && git fetch origin "$BRANCH" && git reset --hard "origin/${BRANCH}") || true
      write_status "ready"
    fi
    exit 0
  fi

  if [ -z "${GITHUB_TOKEN:-}" ]; then
    write_status "missing GITHUB_TOKEN — rebuild image or set token on task"
    exit 1
  fi

  REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"
  write_status "cloning"
  git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$WORKDIR" || { write_status "clone failed"; exit 1; }
  cd "$WORKDIR" || exit 1
  write_status "installing dependencies"
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=6144}"
  pnpm install --frozen-lockfile || { write_status "pnpm install failed"; exit 1; }
  mark_ready
) &

wait "$SERVER_PID"
