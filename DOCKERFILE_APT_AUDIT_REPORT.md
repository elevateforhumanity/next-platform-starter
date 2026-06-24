# Dockerfile apt-get Audit Report

**Date:** June 24, 2026  
**Purpose:** Analyze system dependencies in Dockerfiles for memory optimization

---

## Executive Summary

### Build Stage Dependencies
| Package | Purpose | Used By | Status |
|---------|---------|---------|--------|
| `python3` | Build toolchain | Build tools, canvas, sharp | ✅ Required |
| `build-essential` | Compiler | Native modules | ✅ Required |
| `ca-certificates` | SSL/TLS | HTTPS requests | ✅ Required |
| `libcairo2-dev` | Cairo graphics | Canvas rendering | ⚠️ Conditional |
| `libpango1.0-dev` | Text layout | Canvas rendering | ⚠️ Conditional |
| `libjpeg-dev` | JPEG support | Sharp, Canvas | ⚠️ Conditional |
| `libgif-dev` | GIF support | Sharp, Canvas | ⚠️ Conditional |
| `librsvg2-dev` | SVG rendering | Canvas | ⚠️ Conditional |

### Runtime Stage Dependencies
| Package | Purpose | Status |
|---------|---------|--------|
| `ca-certificates` | SSL/TLS | ✅ Required |
| `curl` | Health checks, HTTP | ✅ Required |
| `fonts-liberation` | PDF fonts | ⚠️ Conditional |

---

## Detailed Analysis

### 1. Build Stage (LMS & Admin - Identical)

```dockerfile
# Install system deps for native modules (sharp, canvas, pdf)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    build-essential \
    ca-certificates \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*
```

#### Dependencies and Their Uses:

| Package | Reason Included | Actual Usage in Code |
|---------|----------------|---------------------|
| `python3` | Build tool for native modules | ⚠️ Build only (removed in slim runtime) |
| `build-essential` | gcc, g++, make | ⚠️ Build only (removed in slim runtime) |
| `ca-certificates` | SSL certs | ✅ Both build & runtime |
| `libcairo2-dev` | 2D graphics library | `canvas` package |
| `libpango1.0-dev` | Text rendering | `canvas` package |
| `libjpeg-dev` | JPEG codec | `sharp` (image processing) |
| `libgif-dev` | GIF codec | `sharp`, `canvas` |
| `librsvg2-dev` | SVG rendering | `canvas` package |

### 2. Runtime Stage (LMS)

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
```

**Rationale:** Runtime uses `node:22-bookworm-slim` which has minimal packages. Only adds:
- `ca-certificates`: For HTTPS/SSL
- `curl`: For health checks in HEALTHCHECK
- `fonts-liberation`: For PDF generation

---

## Package Usage Analysis

### Native Modules in Dependencies

| Package | Version | Native Deps | Bundled? | External? |
|---------|---------|-------------|----------|-----------|
| `sharp` | 0.35.1 | libvips | ✅ Pre-built | ✅ Linux wheels |
| `@napi-rs/canvas` | 3.2.3 | cairo, pango, jpeg, gif, rsvg | ❌ Build required | ❌ Must compile |
| `pdf-lib` | 1.17.1 | None | N/A | Pure JS |
| `pdfkit` | 0.18.0 | None | N/A | Pure JS |
| `jspdf` | 4.2.1 | None | N/A | Pure JS |

### Critical Finding: `@napi-rs/canvas` Requires Native Build

The `@napi-rs/canvas` package (canvas v3) **MUST be compiled** during `pnpm install` because:
- It's a native Node addon using N-API
- No pre-built binaries are distributed
- Requires full native toolchain

**Current Usage:** Only in build scripts (not runtime):
- `scripts/generate-barber-videos.ts`
- `scripts/generate-hvac-lesson-videos.ts`
- `scripts/generate-barber-hybrid-v2.ts`

These are **BUNDLE-TIME ONLY** - not executed in production runtime.

### Critical Finding: `sharp` Uses Pre-built Binaries

`sharp` uses `@img/sharp-libvips-linux-x64` pre-built binaries:
- No compilation needed
- Already includes libvips, cairo, jpeg, gif, webp, etc.
- **NO build-time dependency on cairo, pango, etc.**

**However:** `sharp` is listed in `serverExternalPackages` so it's not bundled, but loaded at runtime. The native binaries should work without the dev libraries.

---

## Memory Impact Analysis

### Build-Time Memory Usage

The apt-get packages contribute to **build-time memory** because:
1. `build-essential` + `python3` = ~200MB disk
2. Graphics libraries (cairo, pango, rsvg) = ~50MB disk
3. Total: ~250MB additional layers

### Runtime Memory Impact

**Minimal to NONE:**
- Packages installed in build stage don't affect runtime
- Runtime uses `node:22-bookworm-slim` base
- Only adds `ca-certificates`, `curl`, `fonts-liberation`

### Potential Optimization

**IF** `@napi-rs/canvas` could be moved to optional dependencies or dynamic imports that are NEVER used in production, the following could be removed from build:

```dockerfile
# REMOVE if canvas is never used in production
libcairo2-dev \
libpango1.0-dev \
librsvg2-dev \
```

But `python3` and `build-essential` would STILL be needed for other native modules.

---

## Recommendations

### 1. Current State: ✅ Acceptable

The apt-get installation pattern is **OPTIMIZED**:
- ✅ Uses `--no-install-recommends` (minimal packages)
- ✅ Cleans apt lists after install (`rm -rf /var/lib/apt/lists/*`)
- ✅ Multi-stage build separates build deps from runtime
- ✅ Runtime uses slim base image

### 2. Potential Optimization (Low Priority)

If `@napi-rs/canvas` is ONLY used in build scripts and never in production:

**Option A: Multi-stage canvas build**
```dockerfile
# Stage 1: Build canvas
FROM node:22-bookworm AS canvas-builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
# ... build canvas ...

# Stage 2: Build app without canvas deps
FROM node:22-bookworm AS builder
# No canvas dependencies needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 build-essential ca-certificates
# ... continue build ...
```

**Option B: Verify canvas is not in production code**
```bash
grep -rn "require.*canvas\|import.*canvas" /workspace/project/Elevate-lms/app /workspace/project/Elevate-lms/lib --include="*.ts"
# Should return: No results (canvas only in /scripts/)
```

### 3. Verify Sharp Works Without Dev Libraries

Current `sharp` usage should work with pre-built binaries:

```typescript
// In lib/image/processing.ts (if exists)
import sharp from 'sharp';
// Sharp loads @img/sharp-libvips-linux-x64 automatically
// No cairo/pango/rsvg needed at runtime
```

---

## Comparison: LMS vs Admin Dockerfiles

| Aspect | LMS (northflank-lms) | Admin (northflank-admin) |
|--------|----------------------|-------------------------|
| Base image | node:22-bookworm | node:22-bookworm |
| Build apt-get | Identical | Identical |
| Runtime base | node:22-bookworm-slim | node:22-bookworm-slim |
| Runtime apt-get | Identical | Identical |
| Memory (build) | 8GB | 8GB |
| Memory (runtime) | 4GB | 4GB |

**Status:** ✅ Dockerfiles are consistent

---

## Security Considerations

### ✅ Good Practices Already in Place

1. **`--no-install-recommends`**: Prevents installing optional dependencies
2. **`rm -rf /var/lib/apt/lists/*`**: Reduces image size, prevents cache exposure
3. **`node:22-bookworm-slim`**: Minimal base for runtime
4. **Multi-stage build**: Build tools don't end up in final image

### ⚠️ Considerations

1. **`python3` in runtime**: Not currently needed (removed in slim)
2. **`curl` in runtime**: Only for health checks - acceptable
3. **Fonts**: `fonts-liberation` for PDF generation - needed

---

## Conclusion

| Finding | Assessment |
|---------|------------|
| apt-get packages are necessary | ✅ YES for native modules |
| Memory impact on build | ✅ 250MB - acceptable |
| Memory impact on runtime | ✅ NONE (build deps removed) |
| Optimization possible | ⚠️ Low priority - canvas only in scripts |
| Security posture | ✅ GOOD - minimal, cleaned, slim base |

### Verdict

**The apt-get commands are NOT causing memory heap issues.**

- Build dependencies are appropriate for native module compilation
- Runtime uses slim image with minimal packages
- Memory constraints are from Node.js (`--max-old-space-size`), not system packages
- Current setup is well-optimized

---

## PART 7: Build Configuration Analysis (CRITICAL FINDINGS)

### Route Count Analysis

| App | Page Routes | API Routes | Total |
|-----|-------------|------------|-------|
| LMS (`app/`) | 1,622 | 1,025 | 2,647 |
| Admin (`apps/admin/app/`) | 385 | 458 | 843 |
| **Total** | **2,007** | **1,483** | **3,490** |

**⚠️ CRITICAL FINDING: Massive Route Count**

The LMS alone has **2,647 routes**. This is extremely large for a Next.js application.

Industry benchmarks:
- Small app: 10-50 routes
- Medium app: 50-200 routes  
- Large app: 200-500 routes
- **Elevate LMS: 2,647 routes** (5x larger than "large")

### Build Command Analysis

**LMS Build (Northflank):**
```bash
# Phased build (from package.json)
build:lms:checks    # Check redirects, guard public routes
build:lms:stamp     # Stamp service worker
build:lms:compile   # NODE_OPTIONS='--max-old-space-size=8192' next build
```

**Admin Build (Separate):**
```bash
# From apps/admin/next.config.mjs
experimental: {
  workerThreads: false,
  cpus: 1,                        // ← Single CPU!
  parallelServerCompiles: false,   // ← No parallel compilation
  parallelServerBuildTraces: false,
}
webpack: {
  parallelism: 1,                // ← Sequential webpack
}
```

### Duplicate Route Check ✅

Script: `scripts/find-duplicate-app-routes.mjs`
**Result:** No duplicate App Router page/route files found.

### BUILD_SCOPE=1 Behavior

From `next.config.mjs`:
```javascript
const skipSentryWebpack =
  process.env.BUILD_SCOPE === '1';  // Skip Sentry webpack wrapping

export default defineNextConfig({
  ...(skipSentryWebpack ? withSentryConfig({}, { disable: true }) : {}),
});
```

**Purpose:** Disables Sentry webpack plugin in CI/Northflank builds to prevent:
- Memory doubling from Sentry's child webpack worker
- Extra build passes for source map uploads

### .dockerignore Analysis ✅

**Contents reviewed - GOOD:**
```dockerignore
# Excludes from build context
.git, node_modules, .next, .turbo, dist
tests, docs, supabase, internal-docs
.env files (except .env.example)
```

**Size impact:** Build context is aggressively pruned. Only necessary files copied.

---

## PART 8: Root Cause Analysis

### Memory Profile by Component

| Component | Memory Impact | Notes |
|-----------|---------------|-------|
| **2,007 pages** | 🔴 HIGH | Each page = webpack chunk compilation |
| **1,483 API routes** | 🟡 MEDIUM | Serverless functions, less memory |
| **2,007 x 385 shared deps** | 🔴 VERY HIGH | Webpack deduplication overhead |
| **barber-course.generated.ts (108KB)** | 🟡 MEDIUM | Large static data file |
| **Admin separate build** | 🟢 LOW | Already separated with `pnpm --filter` |

### The Real Problem: Route Explosion

**Why 2,000+ routes causes high memory:**

1. **Webpack Chunk Compilation**
   - Each page = at least 1 webpack chunk
   - 2,000 pages = 2,000+ chunks to compile
   - Each chunk requires: parsing, type checking, tree shaking, minification

2. **Shared Dependency Graph**
   - `app/layout.tsx` imported by ALL pages
   - If layout imports heavy libs (Supabase, Stripe), ALL pages carry that weight
   - Webpack must resolve this dependency tree for EVERY page

3. **API Routes**
   - 1,483 API routes = 1,483 serverless function bundles
   - Each needs separate webpack compilation
   - `parallelServerCompiles: false` means sequential compilation

### Recommendations

#### 1. Route Count Reduction (High Impact)

**Option A: Dynamic Imports for Rare Routes**
```typescript
// Instead of static import
import RarePage from './rare/page';

// Use dynamic import
const RarePage = dynamic(() => import('./rare/page'));
```

**Option B: Route Groups for Lazy Loading**
```typescript
// app/(marketing)/blog/[slug]/page.tsx
// Group these routes to allow lazy loading
```

**Option C: Migrate Rare Routes to Subdomains**
- Move `/admin/*` routes (already done ✅)
- Consider moving `/docs/*`, `/blog/*`, `/ebook/*` to separate apps

#### 2. Admin Build Already Optimized ✅

The admin app has already been separated and has good optimizations:
```javascript
experimental: {
  cpus: 1,           // Single CPU (stable memory)
  parallelism: 1,    // Sequential webpack
}
```

#### 3. LMS Build - Missing Admin Optimizations ❌

**The LMS Dockerfile uses:**
```dockerfile
RUN NODE_OPTIONS='--max-old-space-size=8192' NEXT_BUILD_CACHE=/cache/.next pnpm next build
```

**But it should ALSO apply the admin optimizations:**
```dockerfile
# Add to build environment
WORKDIR /app
# Set experimental flags
ENV NEXT_DISABLE_TURBOPACK=1
# Use single-threaded build for stability
```

#### 4. Parallel Builds

If routes can be split, use turbo/turborepo for parallel builds:
```bash
# Build in parallel
turbo build --filter=... --parallel
```

---

## Final Verdict

| Finding | Severity | Action Required |
|---------|----------|-----------------|
| 2,647 LMS routes | 🔴 CRITICAL | Long-term: route optimization |
| 1,483 API routes | 🟡 MEDIUM | Consider route grouping |
| Admin already separated | ✅ DONE | Keep as-is |
| .dockerignore | ✅ GOOD | No change needed |
| apt-get packages | ✅ OK | No change needed |

### Primary Cause of Memory Issues

**Route explosion is the root cause of 8GB+ build memory.**

Each of the 2,000+ routes requires webpack compilation. With shared dependencies, the memory multiplies. The 8GB `NODE_OPTIONS` limit is a SYMPTOM (needed to accommodate the large build), not a cause.

### Recommended Actions

1. **Short-term:** Apply same build optimizations as admin (cpus: 1, parallelism: 1)
2. **Medium-term:** Implement dynamic imports for rarely-used routes
3. **Long-term:** Evaluate if all 2,647 routes are necessary, or if some can be:
   - Moved to separate Next.js apps
   - Converted to API-driven pages
   - Deprecated/archived

---

*Report generated by OpenHands automated audit*
