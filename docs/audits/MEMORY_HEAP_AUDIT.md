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

### Investigation Results

**Found SSE Endpoints:**
- `/api/admin/studio/ai-chat` - Streams AI responses via SSE
- `/api/ai-studio/generate-avatar` - Cloudflare streaming

**Found Cron Jobs (3-minute intervals):**
- `memory-cleanup` - Purges old AI memory
- Multiple cron jobs run every few minutes

**Likely Root Cause:**
The error occurs in Next.js internal chunks when:
1. A streaming response is terminated mid-flight
2. The controller state becomes inconsistent
3. Node.js compression pipeline receives malformed stream

### Potential Fixes

**Option 1: Disable compression for streaming routes**
```typescript
// In streaming API routes
return new Response(readable, {
  headers: {
    'Content-Type': 'text/event-stream',
    'X-Accel-Buffering': 'no',
    'Content-Encoding': 'identity', // Force no compression
  },
});
```

**Option 2: Add error boundaries around streams**
```typescript
try {
  // stream logic
} catch (err) {
  logger.error('[stream] error', err);
  return NextResponse.json({ error: 'Stream failed' }, { status: 500 });
}
```

**Option 3: Check Northflank health checks**
- Health probes hitting streaming endpoints
- Containers being restarted on failed probes

### Recommendation
1. Add `'Content-Encoding': 'identity'` to SSE routes
2. Verify health check paths don't hit streaming endpoints
3. Add proper error handling in streaming controllers

---

## 🟡 P1: Redis Rate Limiter Failure

### Error Pattern
```
[rate-limit] Redis unavailable — failing open
context: { tier: "api", error: "res.map is not a function" }
```

### Root Cause
Redis connection failing, but the rate limiter is set to "fail open" (allow requests through).

### Impact
- No rate limiting on public endpoints
- Potential abuse vector
- Spam emails being attempted (SendGrid auth issues)

### Recommendation
1. Check Redis connection string in environment
2. Verify Redis service is running on Northflank
3. Consider Upstash Redis or managed solution

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
