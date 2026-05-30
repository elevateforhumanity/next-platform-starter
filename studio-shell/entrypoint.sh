#!/bin/bash
# entrypoint.sh - start PTY shell server and initialize the mounted repo.
#
# The HTTP server starts immediately so ECS can check liveness. The terminal is
# ready after the repo is cloned and core tools are available. Dependency install
# runs after that and reports status without blocking access to the shell.

set -uo pipefail

READY_FILE="${STUDIO_READY_FILE:-/tmp/studio-ready}"
STATUS_FILE="${STUDIO_STATUS_FILE:-/tmp/studio-setup-status}"
BRANCH="${BRANCH:-main}"
GITHUB_REPO="${GITHUB_REPO:-elevate-for-humanity/Elevate-lms}"
WORKDIR="${WORKDIR:-/repo}"

write_status() {
  printf '%s\n' "$1" > "$STATUS_FILE"
  echo "[entrypoint] $1"
}

fail_setup() {
  write_status "setup failed: $1"
}

write_status "starting"
rm -f "$READY_FILE"

echo "[entrypoint] starting shell server on :${SHELL_PORT:-8888}"
node /home/studio/studio-shell/dist/server.js &
SERVER_PID=$!

(
  set -uo pipefail

  write_status "checking tools"
  for tool in git pnpm psql; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      fail_setup "$tool is missing"
      exit 0
    fi
  done

  if [ -z "${GITHUB_TOKEN:-}" ]; then
    fail_setup "missing GITHUB_TOKEN"
    echo "[entrypoint] GITHUB_TOKEN is required to clone ${GITHUB_REPO}" >&2
    exit 0
  fi

  write_status "cloning ${GITHUB_REPO}@${BRANCH}"
  REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPO}.git"

  if [ -d "${WORKDIR}/.git" ]; then
    cd "$WORKDIR" || { fail_setup "cannot enter ${WORKDIR}"; exit 0; }
    if ! git fetch origin "$BRANCH"; then
      fail_setup "git fetch failed"
      exit 0
    fi
    if ! git reset --hard "origin/${BRANCH}"; then
      fail_setup "git reset failed"
      exit 0
    fi
  else
    mkdir -p "$WORKDIR"
    find "$WORKDIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} + 2>/dev/null || true
    if ! git clone --depth=1 --branch "$BRANCH" "$REPO_URL" "$WORKDIR"; then
      fail_setup "git clone failed"
      exit 0
    fi
    cd "$WORKDIR" || { fail_setup "cannot enter ${WORKDIR}"; exit 0; }
  fi

  git config user.email "studio@elevateforhumanity.org"
  git config user.name "Elevate Studio"
  git config credential.helper store
  printf 'https://x-access-token:%s@github.com\n' "$GITHUB_TOKEN" > ~/.git-credentials
  chmod 600 ~/.git-credentials

  write_status "repo ready; installing dependencies"
  touch "$READY_FILE"
  echo "[entrypoint] repo ready - terminal can connect while dependencies install"

  cd "$WORKDIR" || { fail_setup "cannot enter ${WORKDIR}"; exit 0; }
  if pnpm install --frozen-lockfile; then
    write_status "ready"
    echo "[entrypoint] dependencies installed"
  else
    install_code=$?
    write_status "ready; dependency install failed (exit ${install_code})"
    echo "[entrypoint] pnpm install failed with exit ${install_code}; terminal remains available for repair" >&2
  fi
) &
SETUP_PID=$!

wait "$SERVER_PID"
kill "$SETUP_PID" 2>/dev/null || true
