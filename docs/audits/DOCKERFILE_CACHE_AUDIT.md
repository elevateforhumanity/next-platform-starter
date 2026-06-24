# Dockerfile Cache Invalidation Audit

**Date:** 2026-06-24  
**Purpose:** Ensure proper cache invalidation for builds

## Cache Invalidation Markers

### Current State

```dockerfile
# Dockerfile.northflank-lms (Line 6-8)
# Cache invalidation marker
# P0-2: Increased memory 8GB->16GB, enabled persistent build cache
RUN echo "nf-cache-invalidate-20260623-p0-2-memory-cache"
```

### Issue Found

The marker is a single line echo that Docker caches. When code changes but this RUN instruction stays cached, builds use stale cache.

## Recommendations

### Option 1: Add Timestamp (Current Approach)
```dockerfile
# Cache invalidation - timestamp auto-updates
RUN echo "nf-cache-invalidate-$(date +%Y%m%d-%H%M%S)"
```

### Option 2: Use Build Arg (Recommended)
```dockerfile
ARG CACHE_BUST
RUN echo "Building with cache bust: $CACHE_BUST"
```

### Option 3: Combine with Code Hash
```dockerfile
# Always invalidate on code changes
ARG CODE_HASH
RUN echo "Cache invalidated for build: ${CODE_HASH:-$(date +%s)}"
```

## Memory Configuration

| Service | Build Memory | Runtime Memory |
|---------|--------------|----------------|
| LMS | 8GB (NODE_OPTIONS) | 4GB |
| Admin | 8GB (NODE_OPTIONS) | 4GB |

## Build Cache Settings

```env
# Dockerfile.northflank-lms
ENV NEXT_BUILD_CACHE=/cache/.next
ENV DISABLE_WEBPACK_FILESYSTEM_CACHE=
```

## Checklist

- [x] Cache invalidation marker present
- [ ] Marker uses dynamic timestamp
- [ ] Build cache directory persistent
- [ ] Memory limits set correctly
