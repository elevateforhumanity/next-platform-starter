# Cache Clear Analysis Report

**Date:** June 24, 2026  
**Purpose:** Determine what cache can be cleared and how much space will be saved

---

## Summary

| Cache Type | Location | Can Clear? | Est. Size | Impact |
|------------|----------|------------|-----------|--------|
| **Webpack Cache** | `.next/cache/webpack` | ✅ YES | 500MB - 2GB | Build slower, but clean |
| **Next.js Route Cache** | `.next/cache/routes` | ✅ YES | 100MB - 500MB | Static pages rebuilt |
| **Fetch Cache (ISR)** | `.next/cache/fetch-cache` | ⚠️ PARTIAL | 50MB - 200MB | Some API responses cached |
| **Turbo Cache** | `.turbo` | ✅ YES | 200MB - 1GB | Turborepo slower |
| **ESLint Cache** | `.eslintcache` | ✅ YES | 5MB - 20MB | Minimal |
| **TypeScript Cache** | `.tsbuildinfo` | ✅ YES | 10MB - 50MB | Minimal |
| **pnpm Store** | `~/.pnpm-store` | ⚠️ NO | 1GB - 5GB | Shared across projects |

---

## Cache Types Explained

### 1. Webpack Cache (`.next/cache/webpack`)

**What:** Compiled webpack modules and chunks

**Why it grows:**
- 2,000+ routes = thousands of webpack chunks
- Each route = new compilation entries
- Build plugins add more cache entries

**Can clear:** ✅ YES - Safe to delete anytime

**Space savings:** 500MB - 2GB

**Rebuild impact:** Full rebuild (slower next build)

---

### 2. Route Cache (`.next/cache/routes`)

**What:** Static HTML for pages and API responses

**Why it grows:**
- Each page generates HTML
- Dynamic routes with `generateStaticParams` cache results
- API routes with caching

**Can clear:** ✅ YES - Safe to delete

**Space savings:** 100MB - 500MB

**Rebuild impact:** Static pages rebuilt on demand

---

### 3. Fetch Cache (`.next/cache/fetch-cache`)

**What:** Cached `fetch()` responses and ISR data

**Why it grows:**
- External API responses cached
- Database query results cached
- Revalidation timestamps

**Can clear:** ⚠️ PARTIAL - Some data may be stale

**Space savings:** 50MB - 200MB

**Rebuild impact:** External APIs re-fetched

---

### 4. Turbo Cache (`.turbo`)

**What:** Turborepo task caching

**Why it grows:**
- Each `turbo run build` task cached
- Build outputs cached
- Test results cached

**Can clear:** ✅ YES - Safe to delete

**Space savings:** 200MB - 1GB

**Rebuild impact:** All turbo tasks re-run

---

### 5. ESLint Cache (`.eslintcache`)

**What:** Lint results cache

**Can clear:** ✅ YES - Small

**Space savings:** 5MB - 20MB

**Rebuild impact:** Linting re-runs

---

### 6. TypeScript Build Info (`.tsbuildinfo`)

**What:** TypeScript incremental compilation data

**Can clear:** ✅ YES - Small

**Space savings:** 10MB - 50MB

**Rebuild impact:** Full TS type check

---

## Northflank-Specific Cache

### Persistent Build Cache (`/cache/.next`)

From Dockerfile:
```dockerfile
ENV NEXT_BUILD_CACHE=/cache/.next
RUN mkdir -p /cache/.next && chmod 755 /cache/.next
```

**What:** Northflank persistent volume for build cache

**Size:** 1GB - 4GB (depending on mount size)

**Can clear:** ✅ YES - Forces clean build

**Note:** This is mounted as a volume, not in the repo

---

## Estimated Total Space

| Environment | Current Est. | After Clear |
|-------------|-------------|------------|
| **Local Dev** | 1GB - 4GB | 0 (regenerated) |
| **CI/CD** | 500MB - 2GB | 0 (clean each run) |
| **Northflank Builder** | 2GB - 5GB | 0 (fresh build) |
| **Production Runtime** | N/A | N/A (stateless) |

---

## How to Clear Cache

### Local Development

```bash
# Quick clean (keeps node_modules)
pnpm run clean:fast

# Full clean (removes everything)
pnpm run clean:full

# Or manually:
rm -rf .next .turbo .eslintcache
rm -rf apps/*/.next apps/*/.turbo
rm -rf packages/*/.next packages/*/.turbo
```

### CI/CD (GitHub Actions)

The build already clears cache per-run (no persistent cache).

To force clean build:
```bash
# Add to workflow
- name: Clean build
  run: rm -rf .next .turbo
```

### Northflank

```bash
# Via Northflank UI:
# 1. Go to Service > Storage
# 2. Delete /cache/.next volume
# 3. Trigger rebuild

# Via CLI:
nf volume delete elevate-lms-cache
```

---

## Impact Analysis

### If You Clear Cache

| Component | Impact | Recovery Time |
|-----------|--------|---------------|
| **First build** | 2-3x slower | 10-30 minutes |
| **Subsequent builds** | Normal | Normal |
| **Route compilation** | Full re-compile | 5-15 minutes |
| **Webpack chunks** | Regenerated | 2-5 minutes |

### If You Keep Cache

| Component | Benefit | Risk |
|-----------|---------|------|
| **Incremental builds** | 50-80% faster | Stale cache possible |
| **Route changes** | Only changed routes recompiled | Missed dependencies |

---

## Recommendations

### When to Clear Cache

1. **✅ Clear when:**
   - Build is failing with OOM
   - Seeing strange behavior from old code
   - Major Next.js version upgrade
   - Adding/removing large dependencies
   - Troubleshooting build issues

2. **❌ Don't clear when:**
   - Normal incremental builds
   - Just adding a small feature
   - In CI/CD (already clean)

### Persistent Cache Strategy

**Northflank:** Keep `/cache/.next` persistent for:
- Faster rebuilds during active development
- Incremental feature additions
- Hotfix deployments

**Clear when:**
- Upgrading Node.js or Next.js version
- Adding new heavy dependencies
- Build is consistently failing

---

## Space Savings Calculation

### Typical Build Cache Breakdown

```
.next/
├── cache/
│   ├── webpack/          # 500MB - 1.5GB
│   ├── routes/          # 100MB - 500MB
│   └── fetch-cache/      # 50MB - 200MB
├── static/              # 50MB - 200MB (JS/CSS)
└── server/              # 100MB - 300MB (server chunks)

.turbo/
└── cache/               # 200MB - 1GB

Total:                   # 1GB - 4GB
```

### After Clear

```
.next/                   # 0 (regenerated on build)
.turbo/                 # 0 (regenerated on turbo run)
```

**Total savings: 1GB - 4GB per environment**

---

## Quick Commands

```bash
# Check current cache size
du -sh .next .turbo 2>/dev/null

# Clear webpack cache only (recommended for most issues)
rm -rf .next/cache/webpack

# Clear all Next.js cache
rm -rf .next

# Clear all build caches
rm -rf .next .turbo .eslintcache

# Check what's using space
ncdu .next (if installed)
```

---

## Conclusion

| Question | Answer |
|----------|--------|
| **Can cache be cleared?** | ✅ YES |
| **How much space saved?** | 1GB - 4GB |
| **Safe to clear?** | ✅ YES (forces rebuild) |
| **Performance impact?** | One slower build, then normal |
| **When to clear?** | When troubleshooting or upgrading |

**Verdict:** Clearing cache saves 1-4GB but only matters if you're running low on disk space. The main benefit is a clean build environment, not memory savings (which is determined by `NODE_OPTIONS`).

---

*Report generated by OpenHands automated analysis*
