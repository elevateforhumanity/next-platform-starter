#!/usr/bin/env bash
# Prints the idempotent bundle for Supabase SQL Editor (not auto-applied).
set -euo pipefail
BUNDLE="$(cd "$(dirname "$0")/.." && pwd)/supabase/migrations/20260703000002_pending_migrations_bundle.sql"
echo "Run in Supabase Dashboard → SQL Editor:"
echo "  $BUNDLE"
wc -l "$BUNDLE"
