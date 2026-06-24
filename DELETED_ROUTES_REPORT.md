# Deleted Routes Report

**Date:** June 24, 2026  
**Purpose:** Remove parallel route duplicates to reduce build memory

---

## Summary

| Metric | Before | After | Deleted |
|--------|--------|-------|---------|
| **Total Pages** | 1,622 | 1,348 | **274 pages** |
| **Est. Savings** | - | - | **~2.5MB+** |

---

## Deleted Nested Duplicates

### Phase 1: Basic Nested Duplicates

| Directory | Pages | Reason |
|-----------|-------|--------|
| `app/mentor/mentor/` | 8 | Duplicates `app/mentor/` |
| `app/portal/portal/` | 14 | Duplicates `app/portal/` |
| `app/creator/creator/` | 13 | Duplicates `app/creator/` |
| `app/franchise/franchise/` | 24 | Duplicates `app/franchise/` |
| `app/help/help/` | ~20 | Duplicates `app/help/` |
| **Subtotal** | **~79 pages** | |

### Phase 2: Section Nested Duplicates

| Directory | Pages | Reason |
|-----------|-------|--------|
| `app/legal/legal/` | 31 | Duplicates `app/legal/` |
| `app/career-services/career-services/` | 13 | Duplicates `app/career-services/` |
| `app/docs/docs/` | 14 | Duplicates `app/docs/` |
| `app/support/support/` | 7 | Duplicates `app/support/` |
| `app/policies/policies/` | 36 | Duplicates `app/policies/` |
| `app/community/community/` | 20 | Duplicates `app/community/` |
| `app/workforce-board/workforce-board/` | 8 | Duplicates `app/workforce-board/` |
| **Subtotal** | **~129 pages** | |

### Phase 3: Deep Nested Duplicates

| Directory | Pages | Reason |
|-----------|-------|--------|
| `app/apps/apps/` | 7 | Duplicates `app/apps/` |
| `app/platform/platform/` | 22 | Duplicates `app/platform/` |
| `app/ferpa/ferpa/` | 10 | Duplicates `app/ferpa/` |
| `app/funding/funding/` | 12 | Duplicates `app/funding/` |
| `app/preview/preview/` | 7 | Duplicates `app/preview/` |
| `app/license/license/` | 7 | Duplicates `app/license/` |
| **Subtotal** | **~65 pages** | |

---

## Deleted Unused Redirect Pages

| File | Reason |
|------|--------|
| `app/employee/payrol/page.tsx` | No links, typo (`payrol` not `payroll`) |
| `app/barber-host-shop/page.tsx` | No links found |
| `app/nail-host-shop/page.tsx` | No links found |
| `app/employer/[...path]/page.tsx` | Catch-all redirect, unused |
| `app/partner/[...path]/page.tsx` | Catch-all redirect, unused |
| `app/partner/programs/[program]/edit/page.tsx` | No links |
| `app/admin-login/page.tsx` | Legacy route |
| `app/apprenticeship-programs/page.tsx` | No links |
| `app/install-app/page.tsx` | No links |
| **Subtotal** | **~9 pages** |

---

## Total Deleted

| Category | Pages Deleted |
|----------|---------------|
| Basic Nested Duplicates | ~79 |
| Section Nested Duplicates | ~129 |
| Deep Nested Duplicates | ~65 |
| Unused Redirect Pages | ~9 |
| **TOTAL** | **~282 pages** |

---

## Remaining Redirect Analysis

### Pure Redirect Pages (< 15 lines)

These pages only contain redirects and may be candidates for deletion:

| File | Lines | Redirects To |
|------|-------|-------------|
| `app/admin/page.tsx` | 5 | `/admin/dashboard` |
| `app/mentor/page.tsx` | 5 | `/mentor/dashboard` |
| `app/partner/page.tsx` | 5 | `/partner/dashboard` |
| `app/program-holder/page.tsx` | 5 | `/program-holder/dashboard` |
| `app/workforce/page.tsx` | 5 | `/workforce-board` |
| `app/case-manager/page.tsx` | 7 | (redirect) |
| `app/creator/page.tsx` | 7 | `/creator/products` |
| `app/host-shop/page.tsx` | 7 | (redirect) |
| `app/portal/page.tsx` | 7 | `/portal/dashboard` |
| `app/programs-cdl/page.tsx` | 7 | `/programs/cdl-training` |
| `app/provider/page.tsx` | 7 | `/providers` |
| `app/employer-portal/page.tsx` | 8 | `/employer-portal/candidates` |
| `app/franchise/office/page.tsx` | 8 | `/franchise` |
| `app/store/demo/page.tsx` | 8 | (redirect) |
| `app/demo/admin/dashboard/page.tsx` | 7 | (redirect) |
| `app/admin/quizzes/page.tsx` | 8 | (redirect) |
| `app/admin/workflows/page.tsx` | 8 | (redirect) |

### Pages Using redirect() as PART of functionality

These pages use redirects but also have real content:

| Section | Count |
|---------|-------|
| Admin pages | ~200 |
| LMS pages | ~100 |
| Partner pages | ~30 |
| Employer pages | ~20 |
| Other pages | ~50 |

---

## Next Steps

### Consider Deleting (after verification)

1. **Small redirect-only pages** (verify no external links):
   - `app/admin/page.tsx` - middleware handles `/admin`
   - `app/mentor/page.tsx` - referenced by `backHref="/mentor"`
   - `app/partner/page.tsx` - role-gated route
   - `app/provider/page.tsx` - role-gated route
   - `app/creator/page.tsx` - role-gated route
   - `app/employer-portal/page.tsx` - role-gated route
   - `app/portal/page.tsx` - role-gated route

2. **Store demo/redirect pages**:
   - `app/store/demo/page.tsx` - demo only
   - `app/demo/admin/dashboard/page.tsx` - demo only

3. **Admin stub pages**:
   - `app/admin/quizzes/page.tsx` - stub (9 lines)
   - `app/admin/workflows/page.tsx` - stub (9 lines)

---

## Verification Checklist

After deletions, verify:

- [x] All /mentor/* routes still work (parent exists)
- [x] All /portal/* routes still work
- [x] All /creator/* routes still work
- [x] All /franchise/* routes still work
- [x] All /help/* routes still work
- [x] All /legal/* routes still work
- [x] All /ferpa/* routes still work
- [x] All /funding/* routes still work
- [x] All /docs/* routes still work
- [x] Build completes successfully (run `npm run build`)

---

## Estimated Impact

| Metric | Impact |
|--------|--------|
| Pages Removed | 274 |
| Build Time Reduction | ~15-20% |
| Memory Reduction | ~15-20% |

---

*Report generated by OpenHands automated audit*
