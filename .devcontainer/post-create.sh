#!/usr/bin/env bash
# Runs once when the Dev Container is first created (see devcontainer.json).
set -euo pipefail

echo "── Dev container post-create ──"

sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  git jq postgresql-client ffmpeg chromium python3 python3-pip libxml2-utils
sudo rm -rf /var/lib/apt/lists/*

git --version

corepack enable
corepack prepare pnpm@10.28.2 --activate

pnpm install

bash .devcontainer/setup-env.sh
bash .devcontainer/setup-codex.sh

echo "── Post-create complete. Run: pnpm dev (3000) / pnpm dev:admin (3001) ──"
