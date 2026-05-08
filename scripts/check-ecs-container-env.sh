#!/usr/bin/env bash
set -euo pipefail

LMS_FILE="aws/ecs-task-lms.json"
ADMIN_FILE="aws/ecs-task-admin.json"

if [[ ! -f "$LMS_FILE" || ! -f "$ADMIN_FILE" ]]; then
  echo "Missing ECS task definition files."
  exit 1
fi

extract_names() {
  local file="$1"
  grep -o '"name": "[^"]*"' "$file" | sed -E 's/"name": "([^"]*)"/\1/' | sort -u
}

has_var() {
  local file="$1"
  local var="$2"
  grep -q "\"name\": \"$var\"" "$file"
}

echo "Checking container role split..."
if has_var "$LMS_FILE" "SERVICE_ROLE" && grep -q '"value": "lms"' "$LMS_FILE"; then
  echo "  LMS role: OK"
else
  echo "  LMS role: FAIL"
  exit 1
fi

if has_var "$ADMIN_FILE" "SERVICE_ROLE" && grep -q '"value": "admin"' "$ADMIN_FILE"; then
  echo "  Admin role: OK"
else
  echo "  Admin role: FAIL"
  exit 1
fi

declare -a CORE_VARS=(
  "NEXT_PUBLIC_SITE_URL"
  "NEXT_PUBLIC_ADMIN_URL"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
)

declare -a AI_VARS=(
  "OPENAI_API_KEY"
  "GEMINI_API_KEY"
  "GROQ_API_KEY"
)

echo ""
echo "Checking required core vars in both task definitions..."
core_fail=0
for v in "${CORE_VARS[@]}"; do
  lms_ok="no"
  admin_ok="no"
  has_var "$LMS_FILE" "$v" && lms_ok="yes"
  has_var "$ADMIN_FILE" "$v" && admin_ok="yes"
  echo "  $v -> lms:$lms_ok admin:$admin_ok"
  if [[ "$lms_ok" != "yes" || "$admin_ok" != "yes" ]]; then
    core_fail=1
  fi
done

echo ""
echo "Checking AI vars in both task definitions..."
ai_fail=0
for v in "${AI_VARS[@]}"; do
  lms_ok="no"
  admin_ok="no"
  has_var "$LMS_FILE" "$v" && lms_ok="yes"
  has_var "$ADMIN_FILE" "$v" && admin_ok="yes"
  echo "  $v -> lms:$lms_ok admin:$admin_ok"
  if [[ "$lms_ok" != "yes" || "$admin_ok" != "yes" ]]; then
    ai_fail=1
  fi
done

if [[ "$core_fail" -eq 1 || "$ai_fail" -eq 1 ]]; then
  echo ""
  echo "FAIL: Container env parity check failed."
  exit 2
fi

echo ""
echo "PASS: Both containers define required core and AI vars."
