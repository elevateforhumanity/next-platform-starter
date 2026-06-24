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
