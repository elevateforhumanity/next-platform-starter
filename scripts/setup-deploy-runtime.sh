#!/usr/bin/env bash
# setup-deploy-runtime.sh
#
# One-time setup for the deploy runtime environment.
# Verifies AWS CLI, Docker, and required SSM parameters are accessible.
# Run this before the first CodeBuild or manual deploy to catch config gaps.
#
# Usage:
#   ./scripts/setup-deploy-runtime.sh
#   ./scripts/setup-deploy-runtime.sh --check-only   # no writes, just validate

set -euo pipefail

CHECK_ONLY=false
if [[ "${1:-}" == "--check-only" ]]; then
  CHECK_ONLY=true
fi

REGION="${AWS_DEFAULT_REGION:-us-east-1}"
PASS=0
FAIL=0

ok()   { echo "  ✅ $*"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $*"; FAIL=$((FAIL+1)); }
info() { echo "  ℹ  $*"; }

echo "=== Elevate Deploy Runtime Setup ==="
echo "  Region: ${REGION}"
echo "  Mode:   $([ "${CHECK_ONLY}" == "true" ] && echo 'check-only' || echo 'setup')"
echo ""

# ── AWS CLI ───────────────────────────────────────────────────────────────────
echo "── AWS CLI ──"
if command -v aws &>/dev/null; then
  ok "aws CLI found: $(aws --version 2>&1 | head -1)"
else
  fail "aws CLI not found — install from https://aws.amazon.com/cli/"
fi

if aws sts get-caller-identity &>/dev/null; then
  ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
  ok "AWS credentials valid — account ${ACCOUNT}"
else
  fail "AWS credentials invalid or not configured"
fi

# ── Docker ────────────────────────────────────────────────────────────────────
echo ""
echo "── Docker ──"
if command -v docker &>/dev/null; then
  ok "docker found: $(docker --version)"
else
  fail "docker not found"
fi

if docker info &>/dev/null; then
  ok "Docker daemon running"
else
  fail "Docker daemon not running"
fi

# ── ECR login ─────────────────────────────────────────────────────────────────
echo ""
echo "── ECR ──"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
if [[ -n "${ACCOUNT_ID}" ]]; then
  ECR_HOST="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
  if aws ecr get-login-password --region "${REGION}" | docker login --username AWS --password-stdin "${ECR_HOST}" &>/dev/null; then
    ok "ECR login successful — ${ECR_HOST}"
  else
    fail "ECR login failed"
  fi

  for repo in elevate-lms elevate-admin; do
    if aws ecr describe-repositories --repository-names "${repo}" --region "${REGION}" &>/dev/null; then
      ok "ECR repo exists: ${repo}"
    else
      fail "ECR repo missing: ${repo}"
    fi
  done
fi

# ── Required SSM parameters ───────────────────────────────────────────────────
echo ""
echo "── SSM Parameters ──"
REQUIRED_PARAMS=(
  "/elevate/NEXT_PUBLIC_SUPABASE_URL"
  "/elevate/NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "/elevate/SUPABASE_SERVICE_ROLE_KEY"
  "/elevate/NEXT_PUBLIC_SITE_URL"
  "/elevate/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  "/elevate/STRIPE_SECRET_KEY"
  "/elevate/SENDGRID_API_KEY"
)

for param in "${REQUIRED_PARAMS[@]}"; do
  val=$(aws ssm get-parameter --name "${param}" --with-decryption --query Parameter.Value --output text 2>/dev/null || echo "")
  if [[ -z "${val}" || "${val}" == "PLACEHOLDER" ]]; then
    fail "SSM missing or placeholder: ${param}"
  else
    ok "SSM set: ${param}"
  fi
done

# ── ECS clusters ─────────────────────────────────────────────────────────────
echo ""
echo "── ECS ──"
if aws ecs describe-clusters --clusters elevate-cluster --region "${REGION}" --query 'clusters[0].status' --output text 2>/dev/null | grep -q ACTIVE; then
  ok "ECS cluster elevate-cluster is ACTIVE"
else
  fail "ECS cluster elevate-cluster not found or not ACTIVE"
fi

for svc in elevate-lms-service elevate-admin-service; do
  status=$(aws ecs describe-services --cluster elevate-cluster --services "${svc}" --region "${REGION}" --query 'services[0].status' --output text 2>/dev/null || echo "")
  if [[ "${status}" == "ACTIVE" ]]; then
    ok "ECS service ${svc} is ACTIVE"
  else
    fail "ECS service ${svc} not found or not ACTIVE (status: ${status})"
  fi
done

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "── Summary ──"
echo "  Passed: ${PASS}"
echo "  Failed: ${FAIL}"
echo ""

if [[ "${FAIL}" -gt 0 ]]; then
  echo "❌ Deploy runtime has ${FAIL} issue(s). Fix before deploying."
  exit 1
else
  echo "✅ Deploy runtime is ready."
fi
