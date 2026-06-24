# Memory Heap Analysis - Production Logs

**Date:** 2026-06-24  
**Status:** Critical Issues Found

---

## Error Frequency Analysis

| Error | Frequency | Source | Severity |
|-------|-----------|--------|----------|
| `transformAlgorithm is not a function` | Every 3 min | Unknown | 🔴 HIGH |
| `Redis unavailable - res.map is not a function` | Every 1 min | Rate limiter | 🟡 MED |
| `Image 404 - received null` | ~20 occurrences | Image pipeline | 🟡 MED |
| `permission denied for table` | Occasional | DB RLS policies | 🟡 MED |
| `Stripe webhook signature failed` | Every hour | Stripe integration | 🟢 LOW |
| `SendGrid 401 - auth expired` | On email send | Email service | 🟡 MED |

---

## 🔴 P0: `transformAlgorithm is not a function`

### Error Pattern
```
TypeError: controller[kState].transformAlgorithm is not a function
digest: '2313772001'
```

### Timeline Investigation

| Time | Event | Interval |
|------|-------|----------|
| 17:58:04 | transformAlgorithm error | 3 min from prev |
| 17:55:04 | transformAlgorithm error | 3 min from prev |
| 17:52:04 | transformAlgorithm error | 3 min from prev |
| 17:49:04 | transformAlgorithm error | 3 min from prev |

### Polling Intervals Found

| Component | Interval | Source |
|-----------|----------|--------|
| Timeclock GPS heartbeat | 3 min | `hooks/useTimeclock.ts` (line 9) |
| Apprentice timeclock | 2 min | `app/apprentice/timeclock/page.tsx` |
| Learning Barrier Analyzer | 5 min | `components/admin/` |
| RealTimeCollaboration | 10 sec | `components/` |
| NotificationBell | 30 sec | `components/` |
| LiveMetrics | 60 sec | `components/` |

### Root Cause Analysis

**The 3-minute interval matches GPS heartbeat polling.**

When multiple users are clocked in:
1. Each sends GPS heartbeat every 3 minutes
2. Heartbeat endpoint (`/api/timeclock/heartbeat`) makes multiple DB calls
3. If response compression is applied to JSON responses
4. Next.js internal compression pipeline can fail if:
   - Response is modified mid-compression
   - Stream controller state becomes inconsistent
   - Memory pressure during compression

### Applied Fix

Added `Content-Encoding: identity` to SSE route to prevent compression conflicts.

### Additional Recommendations

1. **Increase heartbeat interval** from 3 min to 5 min to reduce load
2. **Batch heartbeat requests** - send single batched request instead of individual
3. **Add caching** for geofence data (sites don't change frequently)
4. **Monitor memory pressure** during peak hours
5. **Check Northflank health probes** - ensure they're not hitting streaming endpoints

---

## 🟡 P1: Redis Rate Limiter Failure

### Error Pattern
```
[rate-limit] Redis unavailable — failing open
context: { tier: "api", error: "res.map is not a function" }
```

### Root Cause
**UPSTASH_REDIS secrets are NOT configured in GitHub Actions.**

### Current Configuration

**Required Environment Variables:**
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
```

**Files Using Redis:**
| File | Purpose |
|------|---------|
| `lib/rate-limit.ts` | Rate limiting for all API routes |
| `lib/api/withRateLimit.ts` | Per-request rate limiting |
| `lib/store/fulfillment-queue.ts` | Order fulfillment queue |
| `lib/platform/platform-health.ts` | Health check endpoint |

### Impact
- ✅ **Safe**: Rate limiter falls back to in-memory (requests allowed)
- ⚠️ **Risk**: No distributed rate limiting across containers
- ⚠️ **Risk**: Abuse vector on public endpoints

### Missing GitHub Secrets

```bash
gh secret list | grep -i redis
# Returns: (nothing - secrets not set)
```

### Fix Required

1. Create Upstash Redis account at https://console.upstash.com
2. Copy the REST URL and Token
3. Add to GitHub Secrets:
   ```bash
   gh secret set UPSTASH_REDIS_REST_URL --body "https://xxx.upstash.io"
   gh secret set UPSTASH_REDIS_REST_TOKEN --body "your_token_here"
   ```
4. Re-trigger deploy

### Code Analysis

```typescript
// lib/rate-limit.ts
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !url.startsWith('https://')) {
    return null;  // ← Returns null, fallback to in-memory
  }
  ...
}
```

### Rate Limit Tiers

| Tier | Limit | Window | Redis Command |
|------|-------|--------|--------------|
| strict | 3 | 5 min | Sliding window |
| api | 60 | 1 min | Sliding window |
| auth | 5 | 1 min | Sliding window |
| payment | 10 | 1 min | Sliding window |
| public | 5 | 1 min | Sliding window |
| pageLoad | 30 | 1 min | Sliding window |

---

## 🟡 P1: Image 404s - `received null`

### Error Pattern
```
The requested resource isn't a valid image for /images/pages/login-page-1.jpg received null
```

### Root Cause
Images referenced but file doesn't exist or wrong extension.

### Fixed
- ✅ Converted 188 JPG → WebP
- ✅ Fixed `barber-apprenticeship-blueprint.json` reference

### Remaining Check
Search for broken image references in data files.

---

## 🟡 P2: Database Permission Denied

### Error Pattern
```
permission denied for table volunteer_opportunities
permission denied for table positions
```

### Root Cause
Row Level Security (RLS) policies blocking service role access.

### Recommendation
Check Supabase RLS policies for these tables.

---

## 🟢 P3: External Service Failures

### Stripe Webhooks
```
No signatures found matching the expected signature for payload
```
**Fix:** Verify Stripe webhook endpoint and secret

### SendGrid Email
```
The provided authorization grant is invalid, expired, or revoked
```
**Fix:** Re-authenticate SendGrid API key

---

## Memory Configuration (Current)

| Setting | Value | Status |
|---------|-------|--------|
| Build Memory | 8GB (NODE_OPTIONS) | ✅ OK |
| Runtime Memory | 4GB | ✅ OK |
| Build Cache | Persistent `/cache/.next` | ✅ OK |
| Cache Invalidation | Dynamic timestamp | ✅ FIXED |

---

## Action Items

| Priority | Action | Owner |
|----------|--------|-------|
| P0 | Investigate `transformAlgorithm` error source | Dev |
| P1 | Fix Redis connection for rate limiting | Dev |
| P1 | Verify Stripe webhook configuration | Dev |
| P1 | Re-authenticate SendGrid | Dev |
| P2 | Review DB RLS policies | Dev |
| P3 | Fix remaining image 404s | Dev |
