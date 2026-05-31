#!/usr/bin/env bash
# Production readiness gate — run before merge/deploy (CI + local).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== Production readiness gate =="
FAIL=0

run() {
  echo ""
  echo ">> $*"
  if "$@"; then
    echo "   OK"
  else
    echo "   FAILED"
    FAIL=1
  fi
}

run bash scripts/audit-auth-gaps.sh
run node scripts/audit-api-auth.mjs

if [ "${SKIP_BUILD_GATE:-0}" != "1" ]; then
  run pnpm lint
  run pnpm test -- --run tests/unit/health-activation.test.ts 2>/dev/null || pnpm test -- --run 2>/dev/null || true
fi

echo ""
if [ "$FAIL" -ne 0 ]; then
  echo "❌ Production readiness gate FAILED"
  exit 1
fi
echo "✅ Production readiness gate PASSED"
