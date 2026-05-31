# Platform Security & Operations Audit — 2026-05-31

Companion to `docs/platform-hardening-audit-2026-05-31.md`.  
Focus: tenant isolation, cache, route ownership, admin writes, roles, empty states, cron, messaging, uploads, storage, audit logs.

---

## 1. Tenant & domain isolation

### Domain routing (`proxy.ts`)

| Host | Behavior |
|------|----------|
| `www.elevateforhumanity.org` | Canonical public LMS/marketing |
| `elevateforhumanity.org` | 308 → www |
| Non-canonical hosts | 308 → www (legacy domains redirected earlier in file) |
| `app.elevateforhumanity.org` | Tenant admin entry; `?org=<slug>` → `x-tenant-slug` header |
| `{slug}.app.elevateforhumanity.org` | Subdomain tenant; slug → `x-tenant-slug` |

### Gaps

- **`x-tenant-slug` is set in middleware but not read in app/components** (grep shows usage only in `proxy.ts`). Tenant scoping for admin UI relies on **`profiles.tenant_id`** from the authenticated session (`apps/admin/app/admin/layout.tsx` → `getLicenseContext`), not the host header.
- **`enforceAccess()`** (`lib/auth/enforceAccess.ts`) implements cross-tenant denial for API handlers but has **minimal adoption** (~3 references, mostly the module itself). Provider routes use `providerApiGuard` + `tenant_id` on profile instead.
- **Super_admin** intentionally bypasses tenant boundaries (documented in `enforceAccess`).
- **RLS** is the real isolation layer for DB reads/writes; app-layer checks are inconsistent.

**Recommendations**

1. On tenant subdomains, validate `x-tenant-slug` matches `profiles.tenant_id` (or tenant slug join) before serving `/admin/*`.
2. Adopt `enforceAccess({ user, resourceTenantId })` on all provider/case-manager APIs that return row-level data.
3. Document that `www` is shared multi-tenant marketing; only `*.app.elevateforhumanity.org` is tenant-branded admin entry.

---

## 2. Cache invalidation

| Pattern | Usage |
|---------|--------|
| `revalidatePath` | Admin server actions (courses, applications, affiliates, FERPA, cohorts, LMS profile) |
| `revalidateTag` | **Rare** (~1 file) — tag-based invalidation not used consistently |
| `export const revalidate = N` | **~198** `page.tsx` files (ISR/time-based) |
| `unstable_cache` | e.g. LMS learning-paths user data |

**Gaps**

- Mutations via **API routes** often skip `revalidatePath` (only server actions invalidate).
- No central registry of which paths must invalidate after enrollment/program/catalog changes.
- Catalog pages use `revalidate = 60` but API/static fallback may serve stale program counts until TTL expires.

**Recommendations**

1. After program/catalog writes, call `revalidatePath('/programs')`, `revalidatePath('/programs/catalog')`, `revalidatePath('/apply')`.
2. Add `revalidateTag('programs')` to `loadProgramCatalog` consumers when moving to tag-based cache.

---

## 3. Route ownership

**Canonical registry:** `docs/architecture/canonical-routes.md`, `lib/routes/canonical-routes.ts`, `config/canonical-routes.ts`.

| Check | Result |
|-------|--------|
| `pnpm route:audit` | 1 banned prefix: `app/api/donations/webhook` → should be `/api/donate/*` |
| Duplicate page routes | None reported |
| Legacy portals | `/employer-portal` still migrating to `/employer` |

**Auth classification script:** `node scripts/audit-route-auth-strategy.mjs --strict` reports **53 UNCLASSIFIED** routes — **false positives**: cron routes use `withRuntime({ cron: 'bearer' })` which the script does not detect. Update script to match `withRuntime` and `withApiProtection` system auth.

**Enrollment writes:** `guard-enrollment-writes.sh` — **PASS** (no forbidden direct writes).

**Auth gaps script:** `audit-auth-gaps.sh` — no NO_AUTH / ROLE_BLIND hits in current run (REEXPORT check on competency verify-rep only).

---

## 4. Admin data write paths & role permissions

| Layer | Mechanism |
|-------|-----------|
| Admin layout | Roles: `super_admin`, `admin`, `staff`, `org_admin` |
| API admin | `apiRequireAdmin` — `guard-admin-routes.sh` validates 32 routes |
| Provider | `providerApiGuard` + `profiles.tenant_id` |
| Program holder | `require-program-holder.ts` + `tenant_id` scoping |
| Profile immutability | `syncUserProfile.ts` — `tenant_id` set only on INSERT |

**Audit on admin mutations**

- Quality gate: admin mutation pages expected to have audit trails — **PASS** in local commit hook.
- `scripts/unaudited-write-paths.json`: **142** write sites flagged `has_audit: false` (static analysis; many may use `withApiAudit` at export boundary). Top tables: `profiles` (41), `applications` (28), `certificates` (16), `licenses` (16).

**Recommendations**

1. Wrap remaining application approve/reject routes with `withApiAudit` + `writeAdminAuditEvent` for `applications` mutations.
2. Expand `enforceAccess` on admin APIs that accept `user_id` or `tenant_id` query params.

---

## 5. Empty state handling

**Shared component:** `components/admin/AdminPageShell.tsx` → `AdminEmptyState`.

**Coverage:** Many admin dashboards and LMS widgets implement inline empty copy (`No … yet`). Not enforced by lint.

**Gaps**

- SHELL/STATIC admin pages (17 STATIC in inventory) may render tables with no `AdminEmptyState` when query returns `[]`.
- Public catalog with zero programs should show static fallback message (handled by `loadProgramCatalog` static path when DB empty).

**Recommendation:** Add ESLint or Storybook checklist for data tables: require `AdminEmptyState` or equivalent when `data.length === 0`.

---

## 6. Cron reliability

| Metric | Value |
|--------|--------|
| Cron route files (`app/api/cron/*`) | 39 |
| Using `withRuntime({ cron: ... })` | 38+ (all sampled routes) |
| Auth | `CRON_SECRET` via Bearer or `x-cron-secret`; missing secret → **503** from `withRuntime` |
| Duplicate cron tree | `apps/admin/app/api/cron/*` mirrors many jobs (deploy/admin app) |

**Supporting libs:** `lib/api/cron-handler.ts`, `lib/server/cron-auth.ts`, `lib/api/withApiProtection.ts` (system tier).

**Gaps**

- `expire-credentials` returns `error.message` in JSON on failure (line 31) — prefer `safeInternalError`.
- ECS/EventBridge schedule ownership not verified in repo (infra in `aws/` + GitHub Actions).
- `webhook-health-check` cron probes internal routes — ensure those internal routes use same secret headers.

**Recommendations**

1. Extend `audit-route-auth-strategy.mjs` to recognize `withRuntime({ cron`.
2. Add cron heartbeat row / `audit_logs` entry per job completion for ops dashboards.
3. Alert on `audit_failures` growth (see audit-health below).

---

## 7. Email & SMS delivery

### Email

- **Canonical:** `lib/email/sendgrid.ts` ← `lib/email/service.ts`
- **Also:** `lib/email-alerts.ts` (direct SendGrid fetch), Resend docs in `lib/email-templates/README.md` (not primary)
- **Cron/internal:** `lib/email/send-internal.ts` requires `CRON_SECRET` for internal send proxy
- **Health:** `lib/admin/get-site-health.ts` probes SendGrid account API

**Failure mode:** Missing `SENDGRID_API_KEY` → send functions log and return failure (non-throwing in many paths).

### SMS

- **Canonical:** `lib/notifications/sms.ts` (Twilio REST)
- **Requires:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- **Disabled path:** `lib/communication/announcements.ts` — SMS branch stubbed; email primary

**Recommendations**

1. Surface email/SMS status on Dev Studio health panel (SendGrid probe exists; add Twilio ping).
2. Queue failed sends to `notification_queue` / job processor with retry (partially present via `lib/jobs/handlers/email-send.ts`).

---

## 8. File uploads & storage buckets

### Upload routes (sample)

| Route | Bucket | Auth |
|-------|--------|------|
| `POST /api/upload/document` | `provider-documents` | Public + rate limit (pre-account) |
| `POST /api/documents/upload` | `documents` | Authenticated |
| `POST /api/enrollment/upload-document` | `documents` | Authenticated |
| `POST /api/certifications/upload` | `documents` | Authenticated |
| `POST /api/content-library/upload` | `media` | Admin |
| `POST /api/certification/[id]/upload` | `credential_uploads` | Student |

**Validation patterns:** MIME allowlists, size caps (e.g. 10 MB on provider upload), `sanitize()` on filenames, signed URLs for private buckets.

### Buckets referenced in code vs migration `20260702000011_ensure_storage_buckets.sql`

**In migration:** `documents`, `media`, `mous`, `module-certificates`, `course-videos`, `course-content`, `program_holder_documents`, `sam_documents`, `enrollment-documents`, …

**In code but missing from ensure migration (verify live Supabase):**

- `provider-documents` (runtime `createBucket` fallback in upload route)
- `files`
- `assignments`
- `avatars`
- `scorm_packages`
- `provider_exports`
- `credential_uploads` (table exists; bucket name may differ from migration naming)

**Action:** Apply `20260702000011_ensure_storage_buckets.sql` in Dashboard; add idempotent rows for missing buckets above.

---

## 9. Audit logs

### Tables

| Table | Purpose |
|-------|---------|
| `audit_logs` | General app events (FERPA, documents, payments) |
| `admin_audit_events` | Admin mutations (`lib/admin/audit-log.ts`) |
| `audit_failures` | Failed audit writes |
| API wrapper | `withApiAudit` → `admin_audit_events` / monitoring |

### Health endpoint

`GET /api/admin/monitoring/audit-health` (admin app) — counts `audit_logs` last hour/day, `audit_failures`, gap detection during business hours, samples critical endpoints.

### Sentry integration (corrected)

Sentry **is** integrated: `@sentry/nextjs` in `next.config.mjs`, `instrumentation.ts`, `lib/observability/sentry.ts`, payment/webhook routes, `withApiAudit` failures.

**Severity patterns in code:**

| Level | Use |
|-------|-----|
| `captureException` | Job failures, webhooks, audit write failures |
| `captureMessage` … `'error'` | Dead letter queue |
| `captureMessage` level param | `lib/monitoring/index.ts` (info/warning/error) |
| Tags | `tenant_id`, `stripe_event_id`, `payment_intent_id`, `correlation_id`, `job_type` |

**Recommendations**

1. Configure Sentry alert rules: P0 = Stripe/BNPL webhook + `dead_letter` tag; P1 = `audit_failures` spike; P2 = cron job failures.
2. Fix `audit-health` route: uses `createClient` without import in snippet reviewed — verify build on admin app.
3. Reduce `unaudited-write-paths.json` backlog for `applications` and `profiles` mutations.

---

## 10. Quick command reference

```bash
pnpm platform:doctor
pnpm integrity:stripe
pnpm audit:admin
pnpm guard:admin-routes
pnpm route:audit
node scripts/audit-route-auth-strategy.mjs
bash scripts/audit-auth-gaps.sh
bash scripts/guard-enrollment-writes.sh
pnpm images:contract
python3 scripts/admin-route-inventory.py   # needs scripts/live-schema-snapshot.json
```

---

## Priority fix list

1. **Tenant:** Wire `x-tenant-slug` validation to admin layout / API guards.
2. **Storage:** Add missing buckets to migration; apply pending migrations.
3. **Route audit:** Fix `donations/webhook` namespace; teach auth audit script `withRuntime` cron.
4. **Audit:** Cover `applications` write paths with `withApiAudit` / admin audit events.
5. **Cache:** Revalidate program/catalog paths after catalog sync deploy.
6. **Sentry:** Alert rules by tag/severity (see §9).
