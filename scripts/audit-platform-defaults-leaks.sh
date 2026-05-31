#!/usr/bin/env bash
# Fail CI if PLATFORM_DEFAULTS appears as literal text in JSX attrs or single-quoted strings.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAIL=0

echo "== PLATFORM_DEFAULTS leak audit =="

if rg -n 'alt="[^"]*\{PLATFORM_DEFAULTS|alt="\$\{PLATFORM_DEFAULTS' app components -g '*.tsx' -g '*.jsx' 2>/dev/null; then
  echo "❌ JSX alt/title double-quote leaks"
  FAIL=1
fi

if rg -n "'\\\$\{PLATFORM_DEFAULTS" app components app/layout.tsx -g '*.tsx' -g '*.ts' 2>/dev/null | rg -v 'encodeURIComponent|notifications/templates|lib/notifications' || true; then
  LEAKS=$(rg -n "'\\\$\{PLATFORM_DEFAULTS" app/layout.tsx components/home app/page.tsx app/programs/page.tsx -g '*.tsx' 2>/dev/null || true)
  if [ -n "$LEAKS" ]; then
    echo "$LEAKS"
    echo "❌ Single-quoted \${PLATFORM_DEFAULTS...} (use backticks)"
    FAIL=1
  fi
fi

if [ "$FAIL" -eq 0 ]; then
  echo "✅ No PLATFORM_DEFAULTS leaks in critical paths"
fi
exit "$FAIL"
