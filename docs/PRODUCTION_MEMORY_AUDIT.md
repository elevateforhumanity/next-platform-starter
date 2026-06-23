# Production Memory Audit - Elevate LMS

**Date:** June 23, 2026  
**Status:** In Progress  
**Goal:** 40% memory reduction while preserving functionality

---

## Executive Summary

The production memory issue is **NOT primarily caused by data stored in Supabase**. The root causes are:

1. **1,357 API routes** - Largest contributor to memory pressure
2. **1,057 pages** - Significant build overhead
3. **Large static data files** (18,000+ lines across program data files)
4. **Duplicate code between admin/app apps**
5. **Monolithic imports** pulling entire directories into bundles

---

## Critical Findings

### 1. API Route Count: 1,357 ⚠️ CRITICAL

```
apps/app/api/*:         ~800 routes
apps/admin/api/*:       ~550 routes
```

**Problem:** Every API route is eagerly imported and compiled during build, even if unused.

**Recommendations:**
- [ ] Audit which routes are actually called in production
- [ ] Implement route-level code splitting
- [ ] Move admin routes to separate build target if possible
- [ ] Consider dynamic route registration

### 2. Page Count: 1,057 ⚠️ HIGH

```
app/*:                  ~390 pages
apps/app/*:             ~350 pages  
apps/admin/*:          ~300 pages
_archived/*:           ~400 pages (not built but still in repo)
```

**Recommendations:**
- [ ] Verify _archived pages aren't being included in builds
- [ ] Implement route groups to isolate builds
- [ ] Audit for duplicate pages between apps

### 3. Static Data Files: 18,212 lines ⚠️ HIGH

| File | Lines | Records |
|------|-------|---------|
| app/data/programs.ts | 2,378 | 44 programs |
| app/data/curriculum-modules.ts | 1,353 | 94 modules |
| app/data/courses.ts | 718 | 20 courses |
| data/state-licensing.ts | 274 | 26 states |
| Various program data files | ~13,000 | ~300+ programs |

**Recommendations:**
- [x] Already addressed: Migrate programs.ts to database-driven (see programs-table branch)
- [ ] Migrate curriculum-modules to database
- [ ] Migrate state-licensing to database
- [ ] Lazy-load program data on detail pages

### 4. Duplicate Code 🔴 MEDIUM

Both `apps/app` and `apps/admin` contain:
- API routes with identical logic
- Shared components copied instead of imported
- Duplicate lib utilities

**Recommendations:**
- [ ] Create shared packages for common code
- [ ] Use workspace packages for shared types/utils

### 5. Barrel Exports 🔴 MEDIUM

Files like `lib/navigation.ts`, `lib/routes/*`, and `lib/config/*` export everything eagerly.

**Recommendations:**
- [ ] Replace with lazy imports
- [ ] Use `import()` for conditional loading

---

## Memory Consumption Estimates

| Category | Est. Memory | % of Build |
|----------|-------------|------------|
| API Routes (1,357) | ~600 MB | 45% |
| Pages (1,057) | ~400 MB | 30% |
| Static Data | ~150 MB | 11% |
| Dependencies | ~100 MB | 7% |
| Other | ~80 MB | 6% |
| **TOTAL** | **~1,330 MB** | 100% |

---

## Recommended Action Plan

### Phase 1: Quick Wins (1-2 days)
1. [ ] Add `output: 'standalone'` to next.config.mjs
2. [ ] Enable webpack filesystem cache properly
3. [ ] Verify _archived/* is excluded from builds
4. [ ] Set `experimental.optimizePackageImports` for lucide-react, date-fns

### Phase 2: Route Reduction (1 week)
1. [ ] Audit all API routes for usage
2. [ ] Identify dead routes (created but never called)
3. [ ] Archive unused routes instead of deleting
4. [ ] Consider route groups for separate builds

### Phase 3: Data Migration (2 weeks)
1. [x] Programs data → Supabase (in progress)
2. [ ] Curriculum modules → Supabase
3. [ ] State licensing → Supabase
4. [ ] Product catalog → Supabase

### Phase 4: Architecture (Ongoing)
1. [ ] Create shared packages for common code
2. [ ] Implement micro-frontend architecture if needed
3. [ ] Consider separating admin into standalone app

---

## Build Memory Settings

Current settings in `next.config.mjs`:

```javascript
// Development - 4GB
NODE_OPTIONS='--max-old-space-size=4096'

// Fast build - 3GB  
NODE_OPTIONS='--max-old-space-size=3072'

// Cold build (16GB machine) - 16GB
NODE_OPTIONS='--max-old-space-size=16384'
```

**Recommended:** Target 8GB for production builds after optimizations.

---

## Verification Checklist

After each phase, verify:

- [ ] `pnpm build:lms:cold` completes without OOM
- [ ] TypeScript compilation succeeds
- [ ] No runtime errors in production
- [ ] Lighthouse scores maintained
- [ ] All functionality tests pass

---

## Supabase vs Next.js Responsibility

### ✅ SHOULD BE IN SUPABASE
- Database tables (programs, courses, modules)
- Authentication
- File metadata
- User records
- RLS policies
- Scheduled functions

### ❌ MUST REMAIN IN NEXT.JS
- React pages/components
- API routes (business logic)
- Middleware
- Authentication flows
- Image optimization
- Static assets

### ⚠️ CAN BE EITHER (case-by-case)
- Configuration data (< 100 records)
- Lookup tables
- Form definitions
- Workflow configurations

---

**Next Step:** Review Phase 1 quick wins and implement immediately to reduce memory pressure.
