#!/usr/bin/env bash
# Concatenate pending migrations into one file for Supabase SQL Editor.
# Usage: bash scripts/supabase/build-dashboard-bundle.sh > /tmp/elevate-pending.sql

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MIG="$ROOT/supabase/migrations"

emit() {
  local f="$1"
  echo ""
  echo "-- =============================================================================="
  echo "-- FILE: $(basename "$f")"
  echo "-- =============================================================================="
  cat "$f"
  echo ""
}

echo "-- Elevate LMS — pending migrations bundle"
echo "-- Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "-- Project: cuxzzpsyufcewtmicszk"
echo "-- Run in Supabase Dashboard → SQL Editor (one file or section-by-section)."
echo ""

# Phase 1 — LMS gating (required for checkpoints / certs)
emit "$MIG/20260327000003_checkpoint_gating.sql"
emit "$MIG/20260601000006_step_submissions_review_columns.sql"

# Phase 2 — July 2026 batch (skip any section that errors with 'already exists')
for n in $(seq -w 1 14); do
  f="$MIG/202607020000${n}_"*.sql
  for path in $f; do
    [[ -f "$path" ]] && emit "$path"
  done
done

# Phase 3 — learner checkpoint RPC (after checkpoint_gating)
emit "$MIG/20260530100001_lms_checkpoint_certificate_rpc.sql"

echo "-- Done. Verify:"
echo "--   SELECT proname FROM pg_proc WHERE proname = 'record_checkpoint_attempt';"
