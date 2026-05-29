#!/usr/bin/env bash
# .devcontainer/setup-codex.sh
#
# Installs OpenAI Codex CLI and wires OPENAI_API_KEY from the environment
# or from .env.local if already populated by setup-env.sh.
#
# Safe to re-run — skips install if codex is already present.

set -uo pipefail

echo "── Codex CLI setup ──"

# ── 1. Install Codex CLI ──────────────────────────────────────────────────────
if command -v codex &>/dev/null; then
  echo "  ✅ codex already installed: $(codex --version 2>/dev/null || echo 'version unknown')"
else
  echo "  Installing @openai/codex..."
  npm install -g @openai/codex --silent
  echo "  ✅ codex installed: $(codex --version 2>/dev/null || echo 'ok')"
fi

# ── 2. Wire OPENAI_API_KEY ────────────────────────────────────────────────────
ENV_FILE="$(dirname "$0")/../.env.local"

if [ -n "${OPENAI_API_KEY:-}" ]; then
  echo "  ✅ OPENAI_API_KEY already in environment"
elif [ -f "$ENV_FILE" ] && grep -q "^OPENAI_API_KEY=" "$ENV_FILE"; then
  KEY=$(grep "^OPENAI_API_KEY=" "$ENV_FILE" | head -1 | cut -d= -f2-)
  if [ -n "$KEY" ] && [ "$KEY" != "PLACEHOLDER" ]; then
    export OPENAI_API_KEY="$KEY"
    # Persist for future shells
    SHELL_RC="${HOME}/.bashrc"
    if ! grep -q "OPENAI_API_KEY" "$SHELL_RC" 2>/dev/null; then
      echo "export OPENAI_API_KEY=\"$KEY\"" >> "$SHELL_RC"
    fi
    echo "  ✅ OPENAI_API_KEY loaded from .env.local"
  else
    echo "  ⚠️  OPENAI_API_KEY is PLACEHOLDER — set real value in SSM /elevate/OPENAI_API_KEY"
  fi
else
  echo "  ⚠️  OPENAI_API_KEY not found — set it in SSM or export manually before running codex"
fi

# ── 3. Create ~/.codex/config.json with project defaults ─────────────────────
CODEX_DIR="${HOME}/.codex"
CODEX_CONFIG="${CODEX_DIR}/config.json"
mkdir -p "$CODEX_DIR"

if [ ! -f "$CODEX_CONFIG" ]; then
  cat > "$CODEX_CONFIG" << 'JSON'
{
  "model": "o4-mini",
  "approvalMode": "suggest",
  "notify": false,
  "providers": {
    "openai": {
      "name": "OpenAI",
      "baseURL": "https://api.openai.com/v1",
      "envKey": "OPENAI_API_KEY"
    }
  }
}
JSON
  echo "  ✅ ~/.codex/config.json created (model: o4-mini, mode: suggest)"
else
  echo "  ✅ ~/.codex/config.json already exists"
fi

# ── 4. Wire playbook as Codex instructions ───────────────────────────────────
# Codex reads ~/.codex/instructions.md as persistent system context.
# Symlink the repo playbook so it stays in sync with the codebase.
PLAYBOOK="$(dirname "$0")/../docs/CODEX_PLAYBOOK.md"
INSTRUCTIONS="${CODEX_DIR}/instructions.md"

if [ -f "$PLAYBOOK" ]; then
  # Remove stale symlink or file before re-linking
  rm -f "$INSTRUCTIONS"
  ln -s "$(realpath "$PLAYBOOK")" "$INSTRUCTIONS"
  echo "  ✅ ~/.codex/instructions.md → docs/CODEX_PLAYBOOK.md"
else
  echo "  ⚠️  docs/CODEX_PLAYBOOK.md not found — instructions.md not wired"
fi

# ── 5. Print usage ────────────────────────────────────────────────────────────
echo ""
echo "  Codex CLI ready. Usage:"
echo "    codex                          # interactive mode (suggest)"
echo "    codex --approval-mode auto-edit  # auto-edit files, confirm shell"
echo "    codex --approval-mode full-auto  # fully autonomous"
echo "    codex 'fix the TypeScript errors in app/api/barber/webhook/route.ts'"
echo ""
