#!/usr/bin/env bash
set -euo pipefail

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "PASS: $1"
}

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# 1) ECS task roles must stay separated.
LMS_TASK="aws/ecs-task-lms.json"
ADMIN_TASK="aws/ecs-task-admin.json"
[[ -f "$LMS_TASK" ]] || fail "$LMS_TASK missing"
[[ -f "$ADMIN_TASK" ]] || fail "$ADMIN_TASK missing"

grep -q '"name": "SERVICE_ROLE"' "$LMS_TASK" || fail "SERVICE_ROLE missing in LMS task"
grep -q '"value": "lms"' "$LMS_TASK" || fail "LMS task SERVICE_ROLE must be lms"
grep -q '"name": "SERVICE_ROLE"' "$ADMIN_TASK" || fail "SERVICE_ROLE missing in admin task"
grep -q '"value": "admin"' "$ADMIN_TASK" || fail "Admin task SERVICE_ROLE must be admin"
pass "ECS SERVICE_ROLE separation looks correct"

# 2) Deployment workflows must stay separated.
ADMIN_WF=".github/workflows/deploy-admin.yml"
LMS_WF=".github/workflows/deploy-lms.yml"
[[ -f "$ADMIN_WF" ]] || fail "$ADMIN_WF missing"
[[ -f "$LMS_WF" ]] || fail "$LMS_WF missing"

if ! grep -q -- '--project-name' "$ADMIN_WF" || ! grep -q 'elevate-admin-build' "$ADMIN_WF"; then
  fail "deploy-admin must trigger elevate-admin-build"
fi
if ! grep -q -- '--project-name' "$LMS_WF" || ! grep -q 'elevate-lms-build' "$LMS_WF"; then
  fail "deploy-lms must trigger elevate-lms-build"
fi

# Basic path guardrails to avoid accidental cross-deploy coupling.
grep -q '"apps/admin/\*\*"' "$ADMIN_WF" || fail "deploy-admin should watch apps/admin/**"
if grep -q '"apps/admin/\*\*"' "$LMS_WF"; then
  fail "deploy-lms should not watch apps/admin/**"
fi
pass "Deploy workflow split looks correct"

# 3) Keep one canonical admin dashboard entry.
ADMIN_LANDING="apps/admin/app/admin/page.tsx"
ADMIN_DASH_ENH="apps/admin/app/admin/dashboard-enhanced/page.tsx"
ADMIN_LMS_DASH="apps/admin/app/admin/lms-dashboard/page.tsx"

[[ -f "$ADMIN_LANDING" ]] || fail "$ADMIN_LANDING missing"
grep -q "redirect('/admin/dashboard')" "$ADMIN_LANDING" || fail "$ADMIN_LANDING must redirect to /admin/dashboard"
for f in "$ADMIN_DASH_ENH" "$ADMIN_LMS_DASH"; do
  [[ ! -f "$f" ]] || fail "$f should be removed; use /admin/dashboard directly"
done
pass "Admin dashboard route tree is consolidated"

# 4) Legacy admin applicants nav entry should not exist.
if grep -q "href: '/admin/applicants'" components/admin/AdminNav.tsx; then
  fail "AdminNav contains legacy /admin/applicants link"
fi
pass "Admin nav does not include legacy applicants path"

# 5) Legacy app-detail links should use canonical review route.
# Use literal substring checks so template-literal syntax never trips shell parsing.
grep -R --line-number --include='*.tsx' '/admin/applications/${' apps/admin/app/admin >/tmp/legacy_app_links_raw.txt || true
grep -v '/admin/applications/review/' /tmp/legacy_app_links_raw.txt | grep -v '/api/admin/applications/' >/tmp/legacy_app_links.txt || true
if [[ -s /tmp/legacy_app_links.txt ]]; then
  echo "Legacy links found:"
  cat /tmp/legacy_app_links.txt
  fail "Use /admin/applications/review/{id} for admin application detail links"
fi
pass "Admin application detail links use canonical review route"

echo "All admin/LMS separation checks passed."
