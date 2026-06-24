# Middleware Audit Report

**Date:** June 24, 2026  
**File:** `/workspace/project/Elevate-lms/proxy.ts`

---

## Summary

| Metric | Finding |
|--------|---------|
| **Total Constants** | 25+ |
| **Actually Used** | ~8 |
| **Dead Code** | ~17 (67%) |
| **Active Routes** | Webhook, CORS, API Auth, Domain Routing |

---

## 🔴 CRITICAL FINDING: Dead Code in Middleware

### Constants Defined But NEVER USED:

```typescript
// ❌ NEVER CHECKED - Auth is commented as "All routes publicly accessible"
PROTECTED_ROUTES              // Defined but middleware passes everything through
AUTH_REQUIRED_ROUTES          // Never checked
ONBOARDING_REQUIRED_ROUTES    // Never checked  
ENROLLMENT_REQUIRED_ROUTES    // Never checked
PARTNER_ROUTES                // Never checked
NOINDEX_PREFIXES              // Never applied to responses
```

### What Middleware Actually Does:

1. **✅ Webhook Bypass** - Allows `/api/webhooks/*` through without auth
2. **✅ CORS** - Applies to `/api/*` routes
3. **✅ API Auth** - Checks `/api/admin/`, `/api/staff/`, `/api/instructor/`
4. **✅ Domain Routing** - Handles www canonicalization, tenant routing
5. **✅ Public Dashboard Landings** - `PUBLIC_DASHBOARD_LANDINGS` IS used

---

## Active Middleware Logic

### 1. Webhook Paths (Line ~15)
```typescript
const WEBHOOK_PATHS = [
  '/api/webhooks/stripe',
  '/api/webhooks/',
  '/api/license/webhook',
  '/api/stripe/webhook',
  // ... more webhooks
];
```
**Status:** ✅ ACTIVE - Used for auth bypass

### 2. Role-Gated Routes (Line ~40)
```typescript
const PROTECTED_ROUTES = {
  '/employer/':               ['employer', 'sponsor', 'admin'],
  '/partner/':                ['partner', 'partner_admin', 'admin'],
  '/program-holder/':         ['program_holder', 'admin', 'staff', 'org_admin'],
  '/lms/':                     ['student', 'grant_client', 'partner', ...],
  '/mentor/':                  ['mentor', 'admin'],
  // ... more routes
};
```
**Status:** ❌ DEAD CODE - Never checked in middleware

### 3. Public Marketing Prefixes (Line ~120)
```typescript
const PUBLIC_MARKETING_PREFIXES = [
  '/apprenticeships',
  '/programs/',
  '/partners/',
  '/apply',
  '/for-employers',
  '/apprenticeship-sponsor',
  '/pwa',
];
```
**Status:** ✅ ACTIVE - Used for bypassing auth check

### 4. Public Dashboard Landings (Line ~165)
```typescript
const PUBLIC_DASHBOARD_LANDINGS = [
  '/program-holder',
  '/workforce-board',
  '/employer',
  '/partner',
  '/mentor',
];
```
**Status:** ✅ ACTIVE - Exact match public routes

### 5. NOINDEX Prefixes (Line ~180)
```typescript
const NOINDEX_PREFIXES = [
  '/admin', '/lms/', '/learner/', '/apprentice', '/portal/', ...
];
```
**Status:** ❌ DEAD CODE - Never applied to responses

---

## Route Patterns Analysis

### Routes Handled by Middleware:

| Pattern | Purpose | Status |
|---------|---------|--------|
| `/api/webhooks/*` | Stripe/webhook auth bypass | ✅ |
| `/api/*` | CORS + rate limiting | ✅ |
| `/api/admin/*` | Admin auth + IP check | ✅ |
| `/api/staff/*` | Staff auth check | ✅ |
| `/api/instructor/*` | Instructor auth check | ✅ |
| `elevateforhumanity.org` | → www redirect | ✅ |
| `app.elevateforhumanity.org` | Tenant routing | ✅ |
| `{subdomain}.app.*` | Tenant public site | ✅ |
| `PUBLIC_MARKETING_PREFIXES` | Public bypass | ✅ |
| `PUBLIC_DASHBOARD_LANDINGS` | Public dashboards | ✅ |

### Routes NOT Checked (Dead Code):

| Pattern | Defined | Checked | Notes |
|---------|---------|---------|-------|
| `PROTECTED_ROUTES` | ✅ | ❌ | Comment says "All routes publicly accessible" |
| `AUTH_REQUIRED_ROUTES` | ✅ | ❌ | Auth done at page level |
| `ONBOARDING_REQUIRED_ROUTES` | ✅ | ❌ | Not enforced |
| `ENROLLMENT_REQUIRED_ROUTES` | ✅ | ❌ | Not enforced |
| `PARTNER_ROUTES` | ✅ | ❌ | Not enforced |
| `NOINDEX_PREFIXES` | ✅ | ❌ | Never applied |

---

## Middleware Execution Flow

```
Request
  ↓
[1] Webhook Bypass? → Yes → Continue (skip auth)
  ↓ No
[2] API Route?
     ↓ Yes → [3] CORS + Rate Limit
              [4] Protected API?
                  ↓ Yes → Auth check + role verify
                  ↓ No → Continue
     ↓ No
[5] Domain Routing?
     ↓ Yes → [6] www canonicalization
              [7] Tenant routing
     ↓ No
[8] Auth Protection?
    → Public route? → Continue
    → Marketing prefix? → Continue  
    → Dashboard landing? → Continue
    → Default: Continue (all public!)
```

---

## Key Comment in Code

```typescript
// Admin namespace (/admin/*) is canonicalized to NEXT_PUBLIC_ADMIN_URL above.
// The LMS middleware does not own /admin route rendering.

// All routes are publicly accessible - no auth protection in middleware
// Authentication is handled at the component/page level if needed
return nextWithPathname();
```

**This confirms:** Auth is NOT in middleware - it's at page component level.

---

## Recommendations

### 1. Remove Dead Code (Safe Cleanup)

These constants can be removed:
```typescript
// Remove (never used):
PROTECTED_ROUTES
AUTH_REQUIRED_ROUTES
ONBOARDING_REQUIRED_ROUTES
ENROLLMENT_REQUIRED_ROUTES
PARTNER_ROUTES
NOINDEX_PREFIXES
```

### 2. Or Implement the Protection (If Needed)

If auth protection is intended:
```typescript
// Add to middleware:
const isProtectedRoute = AUTH_REQUIRED_ROUTES.some(prefix => 
  pathname.startsWith(prefix)
);

if (isProtectedRoute && !user) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

### 3. Current Behavior Is Intentional

The comment says "All routes publicly accessible" - this may be by design.
Auth is handled at:
- Page component level (`redirect('/login')`)
- API route level (`requireAuth()`)
- Database level (RLS policies)

---

## Files Affected by Middleware Decisions

### Pages That Rely on Middleware:

| File | Middleware Handling |
|------|-------------------|
| `app/mentor/page.tsx` | Public (PUBLIC_DASHBOARD_LANDINGS) |
| `app/partner/page.tsx` | Public (PUBLIC_DASHBOARD_LANDINGS) |
| `app/admin/*` | Handled by `app.elevateforhumanity.org` routing |
| `app/programs/*` | Public (PUBLIC_MARKETING_PREFIXES) |
| `app/apply/*` | Public (PUBLIC_MARKETING_PREFIXES) |
| `app/api/admin/*` | Auth enforced (API auth) |

---

## Conclusion

**The middleware is doing its job** - just less than what the constants suggest:
- ✅ Webhooks bypass auth
- ✅ API routes have CORS and auth
- ✅ Domain routing works
- ✅ Public routes are bypassed
- ❌ But 67% of defined constants are dead code

**The dead code is harmless** but could be cleaned up to avoid confusion.
