# Platform End-to-End Audit — May 2026

Evidence-based audit of forms, RBAC, payments, LMS, testing center, security, observability, DR, and workforce reporting. Use with `bash scripts/audit-auth-gaps.sh`, `bash scripts/audit-env-vars.sh`, and `node scripts/audit-public-html.mjs`.

## Executive summary

| Area | Status | Blocker for unmanned 30-day ops? |
|------|--------|----------------------------------|
| Application → enrollment → training → credential | **Partial** — Stripe webhook + `program_enrollments` + LMS completion chain exist; intake mirror and manual admin steps break automation | Yes |
| Form success UX | **Gaps** — intake returns `success: true` with `mirror_failed`; several actions ignore DB errors | Yes |
| API RBAC | **Gaps** — ~40 routes call `apiRequireAdmin` without `if (auth.error) return auth.error` | Yes |
| Payments | **Mostly wired** — canonical path `/api/programs/enroll/checkout` + Stripe webhook; orphan `ProgramEnrollment.tsx` / missing `kind` on legacy checkout | Medium |
| Testing center | **Admin API exists** — `app/api/admin/testing-center/route.ts`; learner scheduling depends on live DB + exam authorizations | Medium |
| Workforce exports | **Partial** — applicants export, certifications export; gaps on compliance/WIOA unified export; `/api/provider/export` documented but no route file | Medium |
| Security | **Review** — private `documents` bucket `getPublicUrl` in some upload paths; service role must stay server-only | Yes |
| DR / backups | **Weak** — `scripts/rollback-migration.sh` without rollback SQL; schema backup script LMS-only | Yes |
| Observability | **Partial** — `withApiAudit`, `lib/logger`; trace IDs / Sentry context not uniform on all critical paths | Medium |
| Mobile / a11y | **CI gate** — axe in `.github/workflows/compliance-gate.yml`; page-by-page remediation ongoing | Low |

---

## 1. Forms that create records

| Flow | Write target | Success signal | Gap |
|------|--------------|----------------|-----|
| `/apply` intake | `apprenticeship_intake` + `applications` | HTTP 200 + `{ success: true }` | `mirror_failed: true` still shows full success UI |
| `/api/intake` | Same | Always `success: true` unless 4xx/5xx | Admin queue may miss row if RLS/migration not applied |
| Employer post job | `job_postings` | Redirect `/employer/jobs` | Insert error not checked |
| Enroll paid | Stripe session | Redirect to `data.url` | 200 without `url` → silent stall (fixed in this branch) |
| Admin approve application | `program_enrollments`, emails | API JSON | Generally OK with `post-approval` |
| Lab/assignment | `step_submissions` | Form + review API | Instructor UI complete |

**Remediation (P0):** Intake client honors `mirror_failed`; post-job checks insert; enroll throws on missing checkout URL.

---

## 2. Role permissions

**Canonical guards:** `lib/admin/guards.ts` — `apiAuthGuard`, `apiRequireAdmin`, `apiRequireInstructor`.

**Perimeter:** `proxy.ts` (not `middleware.ts`) — domain routing + role gates for page routes. Most `/api/*` rely on per-route guards.

**Known missing `auth.error` checks (sample — run `scripts/audit-api-auth-guards.sh` for full list):**

- `apps/admin/app/api/admin/applications/follow-up-blast/route.ts`
- `apps/admin/app/api/admin/audit-export/route.ts`
- `apps/admin/app/api/admin/barber-onboarding-blast/route.ts`
- `apps/admin/app/api/admin/apprenticeships/hours/[id]/approve/route.ts`
- `app/api/ai/generate-and-publish-course/route.ts`
- `app/api/certification/[id]/mark-forwarded/route.ts`
- `app/api/certification/[id]/verify-upload/route.ts`
- Multiple `app/api/grants/*` routes

**Admin app layout:** `apps/admin/app/admin/layout.tsx` requires `super_admin` for UI; API routes still need explicit guards.

**Remediation (P0):** Add `if (auth.error) return auth.error` to all admin blast/export/AI routes. **P1:** Bounded migration of inline `getUser()` + profile role checks to `apiAuthGuard` / `requireUser()`.

---

## 3. Payments and enrollment workflow

```
Apply (intake) → applications (admin review) → approve → program_enrollments
Self-pay: /api/programs/enroll/checkout → Stripe → webhook → lib/enrollment-service.ts
LMS: lesson_progress → checkpoint_scores → program_completion_certificates → /certification
```

**Gaps:**

- Legacy `POST /api/checkout/create-session` may omit `kind: 'program_enrollment'`.
- `components/.../ProgramEnrollment.tsx` may be orphaned — verify callers.
- Free/funded enroll fallback to `/api/enroll/apply` when checkout fails — OK but should log.

---

## 4. Testing center workflow

- Admin: `GET/POST app/api/admin/testing-center/route.ts` (guarded).
- Learner: exam authorization chain via `lib/services/exam-eligibility.ts`, `exam_funding_authorizations`, certification routes.
- **Verify live:** migrations for exam tables applied in Supabase Dashboard.

---

## 5. LMS / course workflow

- **Read:** `lms_lessons` view → lesson page by `step_type` and `activities` JSONB.
- **Write completion:** `POST /api/lms/progress/complete` → `lesson_progress`, `checkpoint_scores`, certificate issuance.
- **Shell:** `ARTrainingModules` on lab steps — placeholder only; do not market as live AR.
- **Empty modules:** Audit `course_modules` with zero `course_lessons`; run blueprint seeder for new programs.

---

## 6. Student journey without manual resume

| Step | Automated? | Manual intervention |
|------|------------|---------------------|
| Submit application | Yes (intake) | If `mirror_failed`, admin must find row in `apprenticeship_intake` |
| Funding review | No | Staff status transitions |
| Enrollment record | After approve + payment webhook | Approve + Stripe |
| Course access | After `program_enrollments` active | — |
| Checkpoint / certificate | Yes when migrations + content complete | Instructor sign-off for lab/assignment |

**Conclusion:** A real student cannot complete **funded** paths without staff approval by design. **Self-pay** can be end-to-end if intake mirror, checkout, and webhook are healthy.

---

## 7. Security checklist

| Check | Finding |
|-------|---------|
| Service role in client bundles | Must not appear in `NEXT_PUBLIC_*` — audit with `rg SUPABASE_SERVICE_ROLE` in `app/` client components |
| Private buckets public | Grep `getPublicUrl` on `documents` bucket upload routes |
| Student PII in logs | `lib/logger.ts` — avoid logging raw email in production; use hashed/id |
| Locked routes | Run `bash scripts/audit-auth-gaps.sh` (62 no-auth routes per Mar 2026 audit — re-run) |
| Rate limits | Canonical `applyRateLimit` — verify public intake uses `contact` tier |

---

## 8. Observability and audit log

- **API audit:** `withApiAudit` on intake and other routes.
- **Admin audit:** `logAdminAudit` / `audit_logs` table.
- **Gaps:** Not every critical action attaches trace ID; Sentry context varies by route.
- **Admin console:** Dev Studio health, site-audit API — operational visibility for admins, not learner-facing.

---

## 9. Disaster recovery and backups

| Asset | Mechanism | Gap |
|-------|-----------|-----|
| DB | Supabase PITR (hosted) | No automated restore drill in repo |
| Migrations | Forward-only SQL in `supabase/migrations/` | `rollback-migration.sh` without `.down.sql` |
| App | ECS + GitHub Actions `deploy-aws.yml` | Redeploy previous task definition revision manually |
| Audit offsite | `POST /api/admin/audit-export` | Auth guard was try/catch (fixed) |

---

## 10. Analytics and workforce reporting

**Funnel events to verify in DB/analytics:**

- Application: `applications.submitted_at`, status transitions
- Payments: Stripe + `program_enrollments`
- LMS: `lesson_progress`, `lms_progress`, `program_completion_certificates`
- Logins: Supabase auth logs / `profiles.last_sign_in_at` if populated

**Exports:**

- `apps/admin/app/api/admin/applicants/export/route.ts` — OK
- `apps/admin/app/api/admin/certifications/export/route.ts` — OK
- Compliance / attendance / outcomes for state WIOA — confirm product requirements vs existing `compliance/export` routes

---

## 11. Load, mobile, accessibility, data quality

- **Load:** No committed k6/Artillery suite — recommend smoke on `/api/health`, intake POST, checkout session create.
- **Mobile:** Responsive layouts; test LMS lesson player on narrow viewports.
- **A11y:** `tests/e2e/accessibility.spec.ts` in compliance gate.
- **Data quality:** Run duplicate detection SQL on `applications(email)`, `program_enrollments(user_id, program_id)`; audit `programs` rows with `status=published` but no modules.

---

## 12. Can the platform run 30 days without babysitting?

**Not yet** without:

1. Intake mirror reliability (migration `20260628000003_fix_applications_rls.sql` applied + client warns on `mirror_failed`).
2. Closing admin API auth gaps (blast/export/AI publish).
3. Cron jobs healthy: `CRON_SECRET` routes (revalidate-public, expire-credentials, email processor).
4. Stripe webhook monitoring and DLQ for failed enrollments.
5. Supabase backup/PITR confirmation and documented restore runbook.

---

## Remediation tracking

| ID | Priority | Item | Owner |
|----|----------|------|-------|
| E2E-001 | P0 | Intake `mirror_failed` UX + ops alert | This PR |
| E2E-002 | P0 | `apiRequireAdmin` auth.error on blast/export routes | This PR |
| E2E-003 | P0 | Enroll checkout missing URL error | This PR |
| E2E-004 | P1 | post-job insert error handling | This PR |
| E2E-005 | P1 | `scripts/audit-api-auth-guards.sh` in CI | This PR |
| E2E-006 | P2 | Provider export route or remove docs reference | Backlog |
| E2E-007 | P2 | DR restore drill + rollback SQL policy | Backlog |

---

*Generated for Elevate LMS cloud agent audit — re-run scripts after each release.*
