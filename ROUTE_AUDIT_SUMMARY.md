# Route Audit Summary

**Date:** June 24, 2026  
**Purpose:** Analyze 1,622 pages and 1,025 API routes in `app/`

---

## Total Route Count

| Type | Count | Size |
|------|-------|------|
| **Pages** | 1,622 | 12MB |
| **API Routes** | 1,025 | 12MB |
| **Total** | **2,647** | **24MB** |

---

## ⚠️ KEY FINDING: MANY PAGES ARE UNUSED/EMPTY

### Page Size Distribution

| Size Category | Lines | Count | % of Total |
|--------------|-------|-------|------------|
| **Very Small (1-10 lines)** | Redirect/Empty | **65** | 4% |
| **Small (11-50 lines)** | Minimal | **176** | 11% |
| **Medium (51-200 lines)** | Normal | **637** | 39% |
| **Large (200+ lines)** | Complex | **745** | 46% |

---

## UNUSED/EMPTY PAGES (65 pages)

These pages contain ONLY redirects (no actual content):

| Path | Lines | Content |
|------|-------|---------|
| `app/mentor/page.tsx` | 5 | `redirect('/mentor/dashboard')` |
| `app/partner/page.tsx` | 5 | `redirect('/partner/dashboard')` |
| `app/admin/page.tsx` | 5 | `redirect('/admin/dashboard')` |
| `app/provider/page.tsx` | 7 | `redirect('/providers')` |
| `app/creator/page.tsx` | 7 | `redirect('/creator/products')` |
| `app/employer-portal/page.tsx` | 8 | `redirect('/employer-portal/candidates')` |
| `app/portal/page.tsx` | 8 | `redirect('/portal/dashboard')` |
| `app/programs-cdl/page.tsx` | 7 | `redirect('/programs/cdl-training')` |
| `app/pwa/admin/courses/page.tsx` | 7 | PWA admin course redirect |
| +56 more similar pages | 5-10 | Various redirects |

---

## 🔴 DUPLICATE PAGES FOUND

### 1. Admin Duplicate (MAJOR ISSUE)

```
app/admin/         = 297 pages (5.6MB)
apps/admin/app/    = 381 pages

TOTAL: 678 pages with significant overlap!
```

**Note:** ~295 pages are IDENTICAL (same code, same imports)
- Different only in: `canAccessDevStudio={true}` (1 prop)

### 2. Franchise Duplicate Structure

```
app/franchise/                      = 50 pages
app/franchise/franchise/             = nested duplicate

DUPLICATE PAIRS FOUND:
- franchise/apply/page.tsx == franchise/franchise/apply/page.tsx
- franchise/office/page.tsx == franchise/franchise/office/page.tsx
- franchise/office/dashboard/page.tsx == franchise/franchise/office/dashboard/page.tsx
```

### 3. Other Duplicate Patterns

```
app/mentor/      vs app/mentor/mentor/
app/portal/      vs app/portal/portal/
app/creator/     vs app/creator/creator/
```

---

## PAGES ONLY CONTAINING REDIRECTS

### Count by Redirect Destination

| Redirect Target | Count |
|-----------------|-------|
| `/dashboard` | ~15 |
| `/` (root) | ~20 |
| `/community` | ~5 |
| `/login` | ~10 |
| Other redirects | ~15 |

---

## SUMMARY: Waste Potential

| Issue | Pages | Memory Impact |
|-------|-------|---------------|
| **Admin duplicate** | 297 | ~5.6MB wasted |
| **Pure redirect pages** | 65 | ~Minimal (but route bloat) |
| **Nested duplicates** | ~10 | ~Minimal |
| **PWA redirect pages** | ~10 | ~Minimal |
| **TOTAL WASTE** | **~372 pages** | **~5.6MB+** |

---

## Recommendations

### 1. Remove Admin Duplicate (HIGH PRIORITY)
- Option A: Delete `app/admin/` entirely → saves 297 pages, 5.6MB
- Option B: Add `export const dynamic = 'force-static'` + revalidate to prevent SSR
- Ensure `apps/admin/app/admin/` handles all admin routes

### 2. Remove Nested Duplicates
```bash
# Remove these nested folders (they duplicate parent routes)
app/franchise/franchise/    # Merge into app/franchise/
app/mentor/mentor/          # Merge into app/mentor/
app/portal/portal/          # Merge into app/portal/
app/creator/creator/        # Merge into app/creator/
```

### 3. Remove Pure Redirect Pages
- Most are index pages that redirect to `/dashboard`
- Consider if these routes are even needed in Next.js 13+

### 4. Consolidate PWA Routes
- PWA has its own app (`apps/pwa/`)
- Many `app/pwa/` pages may be unnecessary

---

## Pages vs API Routes - They ARE Different

| Type | Count | Purpose |
|------|-------|---------|
| **Pages** | 1,622 | UI - What users SEE |
| **API Routes** | 1,025 | Backend - What users DON'T see |

**Ratio of 1.6:1 is NORMAL for an LMS**

---

## Page Breakdown by Section (Top 20)

| Pages | Routes | Size | Section |
|-------|--------|------|---------|
| 297 | 0 | 5.6M | **admin** ⚠️ DUPLICATE |
| 75 | 0 | 1.1M | pwa |
| 72 | 0 | 1.4M | policies |
| 66 | 0 | 1.2M | store |
| 62 | 0 | 1.1M | legal |
| 57 | 0 | 1.1M | lms |
| 50 | 0 | 1.2M | franchise |
| 30 | 0 | 620K | platform |
| 30 | 0 | 592K | compliance |
| 28 | 0 | 432K | docs |
| 27 | 0 | 412K | employer |
| 27 | 0 | 336K | help |
| 23 | 0 | 492K | onboarding |
| 23 | 0 | 288K | demo |
| 22 | 0 | 444K | funding |
| 22 | 0 | 312K | portal |
| 21 | 0 | 340K | community |
| 20 | 0 | 356K | staff |
| 20 | 0 | 320K | career-services |
| 19 | 0 | 352K | ferpa |

---

## API Routes Breakdown

| Route Group | Count | Est. Size |
|-------------|-------|-----------|
| `/api/*` | 1,025 | 12MB |

**Largest API routes:**
```
1,269 lines  api/barber/webhook/route.ts
1,141 lines  api/webhooks/stripe/route.ts
  791 lines  api/applications/route.ts
  746 lines  api/timeclock/action/route.ts
  609 lines  api/partners/barber-host-shop/apply/route.ts
```

---

## Route Categories

### 1. ADMIN (🔴 HEAVY - POTENTIAL DUPLICATE)
- **app/admin/** - 297 pages (5.6MB)
- **app/pwa/admin/** - ~10 pages
- **Total: ~310 pages**

⚠️ **ISSUE:** `app/admin/` has 297 REAL pages with actual code (not redirects). These are **DUPLICATES** of `apps/admin/app/admin/` (381 pages).

**Duplicate page example:**
```typescript
// app/admin/dashboard/page.tsx
import { getAdminDashboardData } from '@/lib/admin/get-admin-dashboard-data';
import { AdminDashboardContent } from '@/components/admin/dashboard/DashboardShell';

export default async function AdminDashboardPage() {
  const data = normalizeAdminDashboardData(await getAdminDashboardData());
  return <AdminDashboardContent data={data} />;
}
```

**Comment in file:**
> "Auth and role enforcement is handled by apps/admin/app/admin/layout.tsx"

**Meaning:** `app/admin/` pages have real code, but auth is handled elsewhere. This is a MAJOR source of build complexity.

---

### 2. POLICY/LEGAL (🟡 MEDIUM)
- app/policies/ - 72 pages (1.4MB)
- app/legal/ - 62 pages (1.1MB)
- app/ferpa/ - 19 pages
- **Total: 153 pages**

**Content:** Compliance documents, legal pages, FERPA policies, terms of service

**Can be static:** YES - These rarely change and don't need SSR

---

### 3. E-COMMERCE/STORE (🟡 MEDIUM)
- app/store/ - 66 pages (1.2MB)
- app/shop/ - 11 pages
- app/marketplace/ - 8 pages
- **Total: 85 pages**

**Content:** Store, products, checkout, cart

**Note:** Heavy client-side JS, may benefit from dynamic imports

---

### 4. LMS/LEARNING (🟢 CORE)
- app/lms/ - 57 pages (1.1MB)
- app/learner/ - 2 pages
- app/courses-* - various course pages
- **Total: ~80 pages**

**Content:** Core learning management functionality

**Note:** Already separated with `apps/admin/` for admin

---

### 5. FRANCHISE/BUSINESS (🟡 MEDIUM)
- app/franchise/ - 50 pages (1.2MB)
- app/platform/ - 30 pages (620KB)
- app/employer/ - 27 pages
- **Total: 107 pages**

**Content:** Franchise management, employer tools

---

### 6. COMPLIANCE/FUNDING (🟡 MEDIUM)
- app/compliance/ - 30 pages (592KB)
- app/funding/ - 22 pages
- app/wioa-* - 4 pages
- **Total: 56 pages**

**Content:** WIOA compliance, funding programs, reporting

---

### 7. DOCUMENTATION/HELP (🟢 LIGHT)
- app/docs/ - 28 pages (432KB)
- app/help/ - 27 pages (336KB)
- app/support/ - 14 pages
- **Total: 69 pages**

**Can be static:** YES - Documentation rarely changes

---

### 8. APPLICATIONS/ENROLLMENT (🟢 LIGHT)
- app/apply/ - 14 pages (376KB)
- app/enrollment/ - 4 pages
- app/enroll/ - 4 pages
- **Total: 22 pages**

---

### 9. PARTNER PROGRAMS (🟢 LIGHT)
- app/partner/ - 18 pages
- app/barber-host-shop/ - 13 pages
- app/host-shop/ - 13 pages
- **Total: 44 pages**

---

### 10. DEMO/TESTING (🟡 NEEDS REVIEW)
- app/demo/ - 23 pages (288KB)
- app/testing/ - 11 pages
- **Total: 34 pages**

⚠️ **ISSUE:** These appear to be development/demo pages. Should they be in production build?

---

### 11. AUTH/ACCOUNT (🟢 LIGHT)
- app/auth/ - 3 pages (112KB)
- app/account/ - 11 pages
- app/login/ - 2 pages
- **Total: 16 pages**

---

### 12. MARKETING (🟢 CAN BE STATIC)
- app/about/ - 1 page
- app/blog/ - 6 pages (112KB)
- app/contact/ - 1 page
- app/careers/ - 3 pages
- **Total: 11 pages**

**Can be static:** YES - These should be static generated

---

## Key Findings

### 🔴 CRITICAL: Admin Route Duplication

```
app/admin/         = 297 pages (5.6MB)
apps/admin/app/    = 381 pages

TOTAL ADMIN:      = 678 pages

Both have real code, not redirects!
```

**This is a MAJOR source of build complexity.**

---

### 🔴 CRITICAL: Demo/Testing Routes in Production

```
app/demo/          = 23 pages (288KB)
app/testing/       = 11 pages
```

These should be:
1. Moved to separate app (`apps/demo/`)
2. Conditionally compiled with `NEXT_PUBLIC_INCLUDE_DEMO`
3. Or deleted if unused

---

### 🟡 MEDIUM: Policy/Legal Routes (153 pages)

153 pages for policies and legal content. Consider:
- Moving to a CMS
- Combining related policies into single pages with anchors
- Making static

---

## Optimization Opportunities

### Can Be Static (No SSR needed)
- ✅ Policy pages (153 pages)
- ✅ Documentation (69 pages)
- ✅ Marketing pages (11 pages)
- ✅ Legal pages (62 pages)

**Potential savings:** ~295 pages can be pre-rendered

### Can Be Lazy Loaded
- ❌ Store/e-commerce (85 pages)
- ❌ Demo pages (34 pages)

### Should Be Removed/Deduplicated
- ❌ `app/admin/` duplicate (297 pages) - OR redirect to `apps/admin/app/admin/`
- ❌ `app/demo/` (23 pages) - Move to separate app
- ❌ `app/testing/` (11 pages) - Move to separate app

---

## Summary by Size

```
HEAVY (>1MB):
  app/admin/         5.6MB   (297 pages)
  app/api/           12MB    (1,025 routes)
  app/policies/      1.4MB   (72 pages)
  app/franchise/     1.2MB   (50 pages)
  app/store/         1.2MB   (66 pages)

MEDIUM (500KB-1MB):
  app/legal/         1.1MB   (62 pages)
  app/lms/           1.1MB   (57 pages)
  app/pwa/           1.1MB   (75 pages)
  app/onboarding/    492KB   (23 pages)
  app/platform/      620KB   (30 pages)
  app/compliance/    592KB   (30 pages)

LIGHT (<500KB):
  Most other sections
```

---

## Recommendations

### Immediate (High Impact)

1. **Remove or redirect `app/admin/` duplicate**
   - Option A: Add `redirect()` to all `app/admin/*` pages pointing to `apps/admin/app/admin/*`
   - Option B: Delete `app/admin/` entirely and rely on `apps/admin/app/admin/`
   - **Savings: 5.6MB, 297 fewer pages to compile**

2. **Move demo/testing to separate app**
   - Create `apps/demo/` workspace
   - Move `app/demo/` and `app/testing/`
   - **Savings: 288KB, 34 fewer pages to compile**

### Short-term (Medium Impact)

3. **Make policy pages static**
   - Add `export const dynamic = 'force-static'`
   - Add `export const revalidate = 3600`
   - **Savings: Faster builds, less SSR memory**

4. **Make documentation static**
   - Add `export const dynamic = 'force-static'`
   - **Savings: ~70KB, 69 fewer dynamic pages**

### Long-term

5. **Consider CMS for policies**
   - 153 policy pages could be 1 page with dynamic content
   - Reduces from 153 to ~10 template pages

---

## Memory Impact Estimate

| Optimization | Pages Saved | Est. Memory Reduction |
|-------------|-------------|----------------------|
| Remove `app/admin/` duplicate | 297 | ~15-20% |
| Move demo/testing | 34 | ~2-3% |
| Make policies static | 153 | ~5-10% |
| **Total Potential** | **484 pages** | **~25-30%** |

**Note:** These are estimates. Actual memory savings depend on shared dependencies.

---

*Report generated by OpenHands automated audit*
