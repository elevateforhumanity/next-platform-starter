#!/usr/bin/env bash
# test-netlify-edge-blocks.sh
#
# Verifies that Railway/PWA/store routes are blocked at the Netlify edge
# and return 3xx redirects — not 200 (which would mean SSR executed).
#
# Usage: bash scripts/test-netlify-edge-blocks.sh [base_url]
# Default base URL: https://www.elevateforhumanity.org

BASE="${1:-https://www.elevateforhumanity.org}"
PASS=0
FAIL=0

check() {
  local path="$1"
  local expected="$2"  # expected HTTP status prefix, e.g. "3" for any 3xx
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -L --max-redirs 0 "${BASE}${path}" 2>/dev/null)
  local first="${status:0:1}"
  if [ "$first" = "$expected" ] || [ "$status" = "$expected" ]; then
    echo "✅ ${status}  ${path}"
    PASS=$((PASS + 1))
  else
    echo "❌ ${status}  ${path}  (expected ${expected}xx)"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "Testing Netlify edge blocks against: $BASE"
echo "─────────────────────────────────────────────"

# PWA — should redirect (3xx), not execute SSR (200)
check "/pwa/shop-owner/reports"        "3"
check "/pwa/barber"                    "3"
check "/pwa/cosmetology"               "3"

# Store / checkout — Railway e-commerce
check "/store/checkout/cancel"         "3"
check "/store/licenses/managed"        "3"
check "/checkout/barber-apprenticeship" "3"

# LMS — Railway learning platform
check "/lms"                           "3"
check "/lms/courses"                   "3"
check "/lms/dashboard"                 "3"

# Portals — Railway
check "/learner/dashboard"             "3"
check "/instructor/dashboard"          "3"
check "/staff-portal/dashboard"        "3"
check "/case-manager/dashboard"        "3"
check "/partner/dashboard"             "3"
check "/employer/dashboard"            "3"
check "/program-holder/dashboard"      "3"

# Admin — Railway
check "/admin"                         "3"
check "/admin/dashboard"               "3"

# Supersonic / tax — separate repo
check "/supersonic"                    "3"
check "/tax"                           "3"

# Public pages — should still return 200
check "/"                              "2"
check "/programs"                      "2"
check "/about"                         "2"
check "/contact"                       "2"
check "/apply"                         "2"

echo "─────────────────────────────────────────────"
echo "Results: ${PASS} passed, ${FAIL} failed"
echo ""

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
