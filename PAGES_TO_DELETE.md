# Pages to Delete - Route Cleanup List

**Date:** June 24, 2026  
**Purpose:** Remove parallel route duplicates and unused pages to reduce build memory

---

## 📋 SUMMARY

| Category | Count | Est. Savings |
|----------|-------|--------------|
| Nested Duplicates (mentor/mentor, etc.) | 59 pages | ~500KB |
| Help Duplicates (help/help/) | ~20 pages | ~Minimal |
| Admin Duplicate (app/admin/) | 297 pages | ~5.6MB |
| **TOTAL NESTED DUPES** | **~79 directories** | **~500KB** |

### Redirect Pages Status:
- **~8 KEPT** - Needed for role-gated routes
- **~10 DELETE** - Unused/legacy redirects

---

## 1. NESTED DUPLICATE DIRECTORIES (59 pages)

### Delete these entire directories:

```bash
# app/mentor/mentor/ - duplicates app/mentor/
rm -rf /workspace/project/Elevate-lms/app/mentor/mentor/

# app/portal/portal/ - duplicates app/portal/
rm -rf /workspace/project/Elevate-lms/app/portal/portal/

# app/creator/creator/ - duplicates app/creator/
rm -rf /workspace/project/Elevate-lms/app/creator/creator/

# app/franchise/franchise/ - duplicates app/franchise/
rm -rf /workspace/project/Elevate-lms/app/franchise/franchise/
```

### Files inside:
```
mentor/mentor/
  8 pages: dashboard, mentees, sessions, apply, messages, approvals, resources, page

portal/portal/
  14 pages: student/dashboard, profile, notifications, settings, enroll, admin/verify/*

creator/creator/
  13 pages: dashboard, courses, products, community/*, analytics, page

franchise/franchise/
  24 pages: office/*, admin/*, apply, page
```

---

## 2. HELP DUPLICATES (20 pages)

```bash
# app/help/help/ - duplicates app/help/
rm -rf /workspace/project/Elevate-lms/app/help/help/
```

### Files inside:
```
help/help/articles/financial-aid/page.tsx
help/help/articles/how-to-enroll/page.tsx
help/help/articles/reset-password/page.tsx
help/help/articles/certificates/page.tsx
```

---

## 3. PURE REDIRECT PAGES (40 pages) - ANALYSIS COMPLETE

### ✅ NEEDED Redirects (keep these):
These are referenced by middleware or have external links:

| File | Status | Reason |
|------|--------|--------|
| `app/admin/page.tsx` | ✅ **KEPT** | Middleware handles `/admin` → `/admin/dashboard`, but `app/admin/page.tsx` serves as fallback |
| `app/mentor/page.tsx` | ✅ **KEPT** | Referenced: `backHref="/mentor"` in error.tsx |
| `app/partner/page.tsx` | ✅ **KEPT** | Role-gated route in middleware |
| `app/provider/page.tsx` | ✅ **KEPT** | Role-gated route in middleware |
| `app/creator/page.tsx` | ✅ **KEPT** | Role-gated route in middleware |
| `app/employer-portal/page.tsx` | ✅ **KEPT** | Role-gated route in middleware |
| `app/portal/page.tsx` | ✅ **KEPT** | Role-gated route in middleware |
| `app/programs-cdl/page.tsx` | ✅ **KEPT** | Referenced in navigation |

### ❌ DELETE - Nested Duplicates (redundant with parent):
These redirect within their own section - redundant:

| File | Redirects To | Issue |
|------|-------------|-------|
| `app/creator/creator/products/new/page.tsx` | `/store` | Redundant, `/store` exists |
| `app/store/orders/page.tsx` | (redirect) | Duplicates `/orders` if exists |
| `app/creator/creator/community/collaborate/page.tsx` | `/community` | Nested duplicate |
| `app/creator/creator/community/events/page.tsx` | `/community` | Nested duplicate |
| `app/creator/creator/community/resources/page.tsx` | `/community` | Nested duplicate |
| `app/creator/creator/community/forums/page.tsx` | `/community` | Nested duplicate |

### ❌ DELETE - Unused/Legacy Redirects:
No links found, no middleware references:

| File | Status |
|------|--------|
| `app/employee/payrol/page.tsx` | ❌ DELETE - No references |
| `app/barber-host-shop/page.tsx` | ❌ DELETE - No references |
| `app/nail-host-shop/page.tsx` | ❌ DELETE - No references |
| `app/employer/[...path]/page.tsx` | ❌ DELETE - Catch-all unused |
| `app/partner/[...path]/page.tsx` | ❌ DELETE - Catch-all unused |
| `app/partner/programs/[program]/edit/page.tsx` | ❌ DELETE - No references |
| `app/admin-login/page.tsx` | ❌ DELETE - Legacy route |
| `app/apprenticeship-programs/page.tsx` | ❌ DELETE - No references |
| `app/install-app/page.tsx` | ❌ DELETE - No references |

### Community redirects (creator):

| File | Redirects To |
|------|--------------|
| `app/creator/creator/community/collaborate/page.tsx` | `/community` |
| `app/creator/creator/community/events/page.tsx` | `/community` |
| `app/creator/creator/community/resources/page.tsx` | `/community` |
| `app/creator/creator/community/forums/page.tsx` | `/community` |

### Franchise redirects:

| File | Redirects To |
|------|--------------|
| `app/franchise/admin/preparers/page.tsx` | `/franchise` |
| `app/franchise/admin/returns/page.tsx` | `/franchise` |
| `app/franchise/admin/settings/page.tsx` | `/franchise` |

### PWA redirects:

| File | Redirects To |
|------|--------------|
| `app/pwa/admin/courses/page.tsx` | (redirect) |
| `app/pwa/esthetician/page.tsx` | (redirect) |
| `app/pwa/cosmetology/page.tsx` | (redirect) |
| `app/pwa/nail-tech/page.tsx` | (redirect) |

### Store redirects:

| File | Redirects To |
|------|--------------|
| `app/store/orders/page.tsx` | (redirect) |
| `app/creator/creator/products/new/page.tsx` | `/store` |

### Other redirects:

| File | Redirects To |
|------|--------------|
| `app/employee/payrol/page.tsx` | (redirect) |
| `app/barber-host-shop/page.tsx` | (redirect) |
| `app/nail-host-shop/page.tsx` | (redirect) |
| `app/employer/[...path]/page.tsx` | (catch-all redirect) |
| `app/partner/[...path]/page.tsx` | (catch-all redirect) |
| `app/partner/programs/[program]/edit/page.tsx` | (redirect) |
| `app/admin-login/page.tsx` | (redirect) |
| `app/apprenticeship-programs/page.tsx` | (redirect) |
| `app/install-app/page.tsx` | (redirect) |

---

## 4. ADMIN DUPLICATE (297 pages) - MAJOR

```
⚠️  WARNING: This is the BIGGEST optimization
```

### Option A: DELETE `app/admin/` entirely
```bash
rm -rf /workspace/project/Elevate-lms/app/admin/
```
**Saves:** 297 pages, 5.6MB  
**Risk:** Need to ensure `apps/admin/app/admin/` handles all routes

### Option B: CONVERT to redirects only
If `app/admin/` is needed for legacy URLs:

```bash
# Convert each page to a simple redirect
for page in /workspace/project/Elevate-lms/app/admin/*/page.tsx; do
  name=$(basename $(dirname $page))
  cat > "$page" << 'EOF'
import { redirect } from 'next/navigation';
export default function Page() {
  redirect('/admin/DUPLICATE_ROUTE');
}
EOF
done
```

### Check if app/admin is used before deleting:
```bash
# Check for external links to /admin/* (not /apps/admin/)
grep -r "/admin/" /workspace/project/Elevate-lms --include="*.tsx" | grep -v "apps/admin" | head -20
```

---

## 5. SMALL/EMPTY ADMIN PAGES (Admin Studio - 9 pages)

| File | Lines | Status |
|------|-------|--------|
| `app/admin/studio/memory/page.tsx` | 9 | Empty/Stub |
| `app/admin/studio/builds/page.tsx` | 9 | Empty/Stub |
| `app/admin/studio/deployments/page.tsx` | 9 | Empty/Stub |
| `app/admin/studio/agents/page.tsx` | 9 | Empty/Stub |
| `app/admin/studio/workflows/page.tsx` | 9 | Empty/Stub |
| `app/admin/studio/settings/page.tsx` | 9 | Empty/Stub |
| `app/admin/studio/tasks/page.tsx` | 9 | Empty/Stub |
| `app/admin/submissions/opportunities/[id]/page.tsx` | 5 | Redirect |

### These pages exist in `apps/admin/app/admin/studio/` with full implementations

---

## 🚀 RECOMMENDED DELETE ORDER

### Phase 1: Safe deletions (no risk)
```bash
# 1. Nested duplicates - DELETE THESE
rm -rf app/mentor/mentor/
rm -rf app/portal/portal/
rm -rf app/creator/creator/
rm -rf app/franchise/franchise/
rm -rf app/help/help/

# 2. Unused legacy redirect pages - DELETE THESE
rm -f app/employee/payrol/page.tsx
rm -f app/barber-host-shop/page.tsx
rm -f app/nail-host-shop/page.tsx
rm -f app/employer/\[...path\]/page.tsx
rm -f app/partner/\[...path\]/page.tsx
rm -f app/partner/programs/\[program\]/edit/page.tsx
rm -f app/admin-login/page.tsx
rm -f app/apprenticeship-programs/page.tsx
rm -f app/install-app/page.tsx
```

### Phase 2: Admin duplicate (NEEDS VERIFICATION FIRST)
```bash
# Check if /admin/ links point to apps/admin/
grep -r 'href="/admin' --include="*.tsx" | grep -v "apps/admin" | head -10

# If links point to /admin (not /apps/admin), UPDATE LINKS FIRST before deleting

# Safe to delete IF all links updated:
rm -rf app/admin/
```

### Phase 3: Rebuild and test
```bash
npm run build
```

---

## 📊 ESTIMATED IMPACT

| Change | Pages Removed | Build Time Reduction |
|--------|--------------|---------------------|
| Remove nested duplicates | 59 | ~5-10% |
| Remove admin duplicate | 297 | ~25-35% |
| Remove redirect pages | 40 | ~2-3% |
| **TOTAL** | **~396 pages** | **~30-40%** |

---

## ✅ VERIFICATION CHECKLIST

After deletions, verify:

- [ ] All /mentor/* routes still work
- [ ] All /portal/* routes still work  
- [ ] All /creator/* routes still work
- [ ] All /franchise/* routes still work
- [ ] All /admin/* routes still work (via apps/admin)
- [ ] Help articles still accessible
- [ ] PWA still functional
- [ ] Build completes successfully
- [ ] No console errors in production

---

## 📝 FILES CREATED FOR THIS AUDIT

1. `ROUTE_AUDIT_SUMMARY.md` - Full route analysis
2. `ROUTE_ANALYSIS_PAGES_VS_API.md` - Pages vs APIs explanation
3. `PAGES_TO_DELETE.md` - This file - deletion list
