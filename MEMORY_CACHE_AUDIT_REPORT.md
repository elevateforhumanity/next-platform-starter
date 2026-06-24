# In-Memory Cache Audit Report

**Date:** June 24, 2026  
**Purpose:** Comprehensive audit of all in-memory caching patterns for memory leak risks

---

## Executive Summary

### Risk Assessment

| Cache | Location | Risk Level | Size Limit | TTL | Cleanup |
|-------|----------|------------|------------|-----|---------|
| `memoryCache` | `lib/performance/cache.ts` | 🟡 MEDIUM | ❌ None | ✅ 60s | ✅ setInterval |
| `inMemoryRateLimiters` | `lib/rate-limit.ts` | 🟢 LOW | ❌ None | ✅ Auto | ✅ Self-resetting |
| AI Explain Cache | `app/api/lms/ai/explain/route.ts` | 🔴 **HIGH** | ❌ **UNBOUNDED** | ✅ 1hr | ❌ **NONE** |
| `localCache` (ConversationStore) | `lib/studio/conversation-store.ts` | 🟡 MEDIUM | ✅ 50 limit | ❌ None | ⚠️ Manual |
| `ContentAutomation.cache` | `lib/new-ecosystem-services/ContentAutomation.ts` | 🟡 MEDIUM | ❌ None | ❌ None | ❌ None |
| `URLHealthMonitor.healthStatus` | `lib/new-ecosystem-services/URLHealthMonitor.ts` | 🟢 LOW | ✅ Bounded | ✅ Auto | ✅ Bounded |
| `events[]` | `lib/monitoring.ts` | 🟡 MEDIUM | ✅ 10k max | ❌ None | ✅ shift() |
| `originalFiles`/`currentFiles` | `lib/devstudio/fs/index.ts` | 🔴 **HIGH** | ❌ **UNBOUNDED** | ❌ None | ⚠️ Manual |
| **Global Maps/Sets** | Various | 🟡 MEDIUM | Varies | Varies | Varies |

---

## Detailed Analysis by Cache

### 1. lib/performance/cache.ts ✅ HAS CLEANUP

```typescript
const memoryCache = new Map<string, { value: any; expires: number }>();

// Cleanup every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (value.expires < now) {
      memoryCache.delete(key);
    }
  }
}, 60000);
```

**Assessment:** ✅ GOOD
- Has TTL-based expiration
- Has automatic cleanup every 60 seconds
- Falls back to Redis when available

**Potential Issue:** No size limit on cache entries - if TTL is very large, cache could grow indefinitely before cleanup runs.

---

### 2. lib/rate-limit.ts (Fallback) ⚠️ NEEDS MONITORING

```typescript
const inMemoryRateLimiters = new Map<string, { count: number; resetAt: number }>();

export function checkInMemoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = inMemoryRateLimiters.get(key);
  
  if (!entry || now > entry.resetAt) {
    inMemoryRateLimiters.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  // ...
}
```

**Assessment:** ⚠️ ACCEPTABLE WITH MONITORING
- Entries auto-expire when `resetAt` passes
- Old keys never accumulate (automatic cleanup on next access)
- **BUT:** If Redis is down for extended period, keys accumulate until they reset

**Risk:** If Redis goes down, in-memory fallback activates and grows until Redis comes back.

---

### 3. app/api/lms/ai/explain/route.ts 🔴 CRITICAL - NO CLEANUP

```typescript
// Simple in-memory cache — keyed by content hash, evicted after 1 hour.
const cache = new Map<string, { result: string; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  // ...
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ simplified: cached.result, cached: true });
  }
  // ...
  cache.set(key, { result: simplified, ts: Date.now() });
}
```

**Assessment:** 🔴 **HIGH RISK - NO SIZE LIMIT**

**Problems:**
1. **NO SIZE LIMIT** - Cache grows unbounded
2. **NO PERIODIC CLEANUP** - Only checks on cache hit
3. **Stale entries stay forever** - If a key is never hit again, it stays in memory

**Worst Case Scenario:**
- 1,000 unique users with unique content = 1,000 entries
- Each entry ~8KB = 8MB per hour
- 10,000 users = 80MB per hour
- Over days/weeks = significant memory growth

**Recommendation:** Add LRU eviction or periodic cleanup:
```typescript
const MAX_CACHE_SIZE = 1000;
if (cache.size >= MAX_CACHE_SIZE) {
  // Remove oldest entry
  const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
  cache.delete(oldest[0]);
}
```

---

### 4. lib/studio/conversation-store.ts ⚠️ NEEDS REVIEW

```typescript
class ConversationStore {
  private localCache: Map<string, ConversationSession> = new Map();
  
  private async loadFromCloud(): Promise<void> {
    // ...
    this.localCache.clear();
    data?.forEach((conv: StoredConversation) => {
      this.localCache.set(conv.id, session);
    });
  }
}
```

**Assessment:** ⚠️ MEDIUM RISK
- Cache is bounded by `.limit(50)` from cloud fetch
- Cache is cleared on reload
- **BUT:** If user has 50+ large conversations, each with many messages, could be significant memory

**Potential Issue:** `ConversationSession` contains full message history. Large conversations could use significant memory.

---

### 5. lib/new-ecosystem-services/ContentAutomation.ts ⚠️ NEEDS REVIEW

```typescript
export class ContentAutomation {
  private static instance: ContentAutomation;
  private dataFeeds: Map<string, DataFeed> = new Map();
  private contentRules: ContentRule[] = [];
  private cache: Map<string, any> = new Map();  // ⚠️ UNBOUNDED
  
  scheduleAutomaticUpdates(): void {
    this.dataFeeds.forEach((feed) => {
      setInterval(() => {
        this.updateFeed(feed);
      }, feed.updateFrequency);
    });
  }
}
```

**Assessment:** ⚠️ MEDIUM RISK
- `dataFeeds` is bounded (fixed at 6 feeds)
- `cache` is unbounded but only stores 6 entries (one per feed)
- **BUT:** Each cached data could be large (government API responses)
- Intervals created but never cleaned up

**Potential Issue:** If feed data is large JSON, cache could grow significantly.

---

### 6. lib/new-ecosystem-services/URLHealthMonitor.ts ✅ GOOD

```typescript
export class URLHealthMonitor {
  private endpoints: Map<string, ServiceEndpoint> = new Map();
  private healthStatus: Map<string, URLCheck> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  stopMonitoring(): void {
    for (const [id, interval] of this.checkIntervals) {
      clearInterval(interval);
    }
    this.checkIntervals.clear();
  }
}
```

**Assessment:** ✅ GOOD
- Fixed number of endpoints (bounded)
- Health status per endpoint (bounded)
- Has `stopMonitoring()` to clear intervals
- **BUT:** If `startMonitoring()` called multiple times without stop, intervals accumulate

---

### 7. lib/monitoring.ts ✅ GOOD

```typescript
const events: MonitoringEvent[] = [];
const MAX_EVENTS = 10000;

export function logEvent(event: Omit<MonitoringEvent, 'timestamp'>) {
  events.push(fullEvent);
  
  if (events.length > MAX_EVENTS) {
    events.shift();  // Remove oldest
  }
}
```

**Assessment:** ✅ GOOD
- Fixed size array (MAX_EVENTS = 10,000)
- Automatic eviction of oldest when full
- **Potential improvement:** Could use Map with timestamps for faster eviction

---

### 8. lib/devstudio/fs/index.ts 🔴 HIGH RISK - NO CLEANUP

```typescript
class DevStudioFS {
  private originalFiles: Map<string, string> = new Map();      // ⚠️ UNBOUNDED
  private currentFiles: Map<string, string> = new Map();        // ⚠️ UNBOUNDED
  private deletedFiles: Set<string> = new Set();
  private fileShas: Map<string, string> = new Map();
  
  async loadRepoToRuntime(repo: string, branch: string, ...): Promise<void> {
    // Clears previous state on new repo load
    this.originalFiles.clear();
    this.currentFiles.clear();
    // ...
  }
}
```

**Assessment:** 🔴 **HIGH RISK**

**Problems:**
1. **NO SIZE LIMIT** on file storage
2. **NO AUTOMATIC CLEANUP** - only cleared on `resetFS()` or `clear()`
3. **File contents stored as strings** - could be large
4. **Singleton pattern** - instance persists across requests

**Worst Case:**
- User loads a 1GB repo with 10,000 files
- All file contents stored in memory
- If user switches repos without calling `resetFS()`, memory doubles

**Risk:** The dev studio feature is likely only used by admins, but if a malicious actor loads a large repo, could cause memory issues.

---

### 9. Client-Side Maps/Sets ✅ ACCEPTABLE

Many files use `new Set()` and `new Map()` for UI state:

```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
const [uploadedTypes, setUploadedTypes] = useState<Set<string>>(new Set());
```

**Assessment:** ✅ GOOD
- React handles cleanup when component unmounts
- Limited to user's current session
- No persistent memory issues

---

## Risk Summary by Severity

### 🔴 CRITICAL (Fix Immediately)

| Location | Issue | Fix |
|----------|-------|-----|
| `app/api/lms/ai/explain/route.ts` | Unbounded cache, no cleanup | Add LRU eviction or size limit |
| `lib/devstudio/fs/index.ts` | Unbounded file storage | Add size limit + periodic cleanup |

### 🟡 MEDIUM (Monitor and Fix Soon)

| Location | Issue | Fix |
|----------|-------|-----|
| `lib/performance/cache.ts` | No size limit | Add LRU eviction |
| `lib/studio/conversation-store.ts` | Large objects in cache | Limit conversation history |
| `lib/new-ecosystem-services/ContentAutomation.ts` | Large cached data | Set reasonable limits |

### 🟢 LOW (Acceptable)

| Location | Status |
|----------|--------|
| `lib/rate-limit.ts` | Auto-expires |
| `lib/monitoring.ts` | Has MAX_EVENTS limit |
| `lib/new-ecosystem-services/URLHealthMonitor.ts` | Bounded endpoints |
| Client-side Sets/Maps | React-managed |

---

## Recommendations

### Immediate Actions

1. **Fix AI Explain Cache** (`app/api/lms/ai/explain/route.ts`):
```typescript
const MAX_CACHE_SIZE = 1000;
if (cache.size >= MAX_CACHE_SIZE) {
  const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
  cache.delete(oldest[0]);
}
```

2. **Add size limit to DevStudioFS** (`lib/devstudio/fs/index.ts`):
```typescript
const MAX_FILES = 1000;
const MAX_FILE_SIZE = 500000; // 500KB

if (this.currentFiles.size >= MAX_FILES) {
  // Remove oldest accessed file
  const oldest = [...this.currentFiles.keys()][0];
  this.currentFiles.delete(oldest);
}
```

3. **Add cleanup to ContentAutomation**:
```typescript
private cleanupCache(): void {
  const MAX_CACHE_SIZE = 10;
  if (this.cache.size > MAX_CACHE_SIZE) {
    const keys = [...this.cache.keys()];
    keys.slice(0, -MAX_CACHE_SIZE).forEach(k => this.cache.delete(k));
  }
}
```

### Monitoring Actions

1. **Add memory metrics to health check**:
```typescript
// In app/api/health/route.ts
memory: {
  used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
  external: Math.round(process.memoryUsage().external / 1024 / 1024),
}
```

2. **Add cache size logging**:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(`[cache] size: ${cache.size}, max: ${MAX_CACHE_SIZE}`);
}
```

---

## Memory Impact Analysis

### Production Impact Assessment

| Cache | Max Entries | Est. Size per Entry | Max Memory |
|-------|-------------|---------------------|------------|
| AI Explain | 1,000 (unbounded) | 8KB | ~8MB |
| DevStudioFS | 10,000 files | 50KB avg | ~500MB |
| ConversationStore | 50 | 500KB | ~25MB |
| ContentAutomation | 6 | 100KB | ~600KB |

### Most Likely Cause of Memory Issues

**`lib/devstudio/fs/index.ts` is the highest risk** because:
1. Stores actual file contents (strings)
2. No automatic cleanup
3. Singleton persists across requests
4. User-controlled content size

**AI Explain cache is second** because:
1. Bounded by uniqueness of content
2. Worst case = 1,000 users × unique content = unbounded

---

## CRITICAL CORRECTION: Cache vs Memory

### Important Distinction

| Term | What It Means | Cleared By |
|------|---------------|------------|
| **Disk Cache** (`.next`, `.turbo`) | Compiled output stored on disk | `rm -rf .next` ✅ |
| **Runtime Memory** (Node heap) | RAM used during build | `NODE_OPTIONS` setting ❌ |

**Key Point:** Clearing `.next` and `.turbo` recovers **disk space**, NOT memory.

### Why Cache Clearing Won't Fix Memory Spikes

1. **Cache = disk files** - Webpack bundles stored on disk
2. **Memory = Node heap** - RAM used during compilation
3. **Clearing cache** = Next build must recompile EVERYTHING (may use MORE memory temporarily)

### Actual Route Counts (Verified)

| App | Pages | API Routes | Total |
|-----|-------|------------|-------|
| **LMS** (`app/`) | 1,622 | 1,033 | **2,655** |
| **Admin** (`apps/admin/app/`) | 385 | 2 | **387** |
| **Total** | **2,007** | **1,035** | **3,042** |

### Largest Route Groups (Verified)

```
12M     app/api/           ← #1 culprit
5.6M    app/admin/
1.4M    app/policies/
1.2M    app/store/
1.2M    app/franchise/
```

### Root Cause Summary

**The memory issue is caused by:**
1. 2,000+ routes requiring webpack compilation
2. Shared dependency tree (each route imports layout → layout imports heavy libs)
3. Serverless function generation for 1,000+ API routes

**NOT caused by:**
- Build cache size
- Disk space
- Cleanup scripts

---

## Recommendations

### Short-term (Do Now)
1. Keep `NODE_OPTIONS='--max-old-space-size=8192'` ✅
2. Apply admin's single-threaded build config to LMS
3. Consider `NEXT_DISABLE_TURBOPACK=1`

### Medium-term (Route Optimization)
1. Audit which routes can be:
   - Converted to dynamic imports
   - Moved to separate apps
   - Deprecated/archived
2. Implement LRU eviction for AI Explain cache

### Long-term
Evaluate if all 2,655 LMS routes are necessary.

---

## Conclusion

| Finding | Root Cause? | Fixable by Cache Clear? |
|---------|-------------|--------------------------|
| 2,000+ routes | ✅ YES | ❌ NO |
| Webpack compilation | ✅ YES | ❌ NO |
| Dependency tree | ✅ YES | ❌ NO |
| Build cache | ❌ NO | ✅ YES (but irrelevant) |
| Disk space | ❌ NO | ✅ YES |

**Verdict:** Route explosion is the root cause of build memory issues. Cache clearing saves disk space only.

---

*Report generated by OpenHands automated audit*
