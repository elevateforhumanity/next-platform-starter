# Admin Duplicate Comparison: app/admin vs apps/admin/app/admin

**Date:** June 24, 2026

---

## SUMMARY

| Location | Pages | Route Prefix |
|----------|-------|--------------|
| `app/admin/` | 297 | `/admin/*` |
| `apps/admin/app/admin/` | 381 | `/apps/admin/*` |

**Total unique routes if merged:** ~400 (removing duplicates)

---

## MISSING FROM app/admin (in apps/admin but not in app/admin)

These routes exist in `apps/admin` but NOT in `app/admin`:

### New/Create Routes
| Route | Purpose |
|-------|---------|
| `affiliates/new` | Create new affiliate |
| `barbershops` | Barbershop management |
| `cohorts/new` | Create new cohort |
| `career-courses` | Career courses management |
| `career-courses/create` | Create career course |
| `compliance-audit` | Compliance audit |
| `compliance/agreements` | Compliance agreements |
| `compliance/financial-assurance/new` | New financial assurance |
| `credentials/new` | Create new credential |
| `crm/appointments/new` | New CRM appointment |
| `crm/campaigns/new` | New campaign |
| `crm/contacts/new` | New contact |
| `crm/deals/new` | New deal |
| `crm/leads/new` | New lead |
| `dev-studio` | Developer studio |
| `document-center` | Document center |
| `documents/templates` | Document templates |
| `email-marketing` | Email marketing |
| `email-marketing/analytics` | Email analytics |
| `email-marketing/automation` | Email automation |
| `email-marketing/automation/new` | New email automation |
| `email-marketing/campaigns/new` | New email campaign |
| `email-marketing/sendgrid` | SendGrid integration |
| `employers/new` | Create new employer |
| `fssa-impact` | FSSA impact tracking |
| `fssa-impact/attendance` | FSSA attendance |
| `fssa-impact/budget` | FSSA budget |
| `fssa-impact/intake` | FSSA intake |
| `fssa-impact/participants` | FSSA participants |
| `fssa-impact/participants/[id]` | FSSA participant detail |
| `fssa-impact/tpp-survey` | TPP survey |
| `grants/applications/new` | New grant application |
| `hr/employees/new` | New employee |
| `impersonate` | User impersonation |
| `instructor` | Instructor management |
| `instructor/analytics` | Instructor analytics |
| `instructor/announcements` | Instructor announcements |
| `instructor/attendance` | Instructor attendance |
| `instructor/campaigns` | Instructor campaigns |
| `instructor/courses` | Instructor courses |
| `instructor/courses/[courseId]/announcements` | Course announcements |
| `instructor/courses/[courseId]/assignments` | Course assignments |
| `instructor/courses/[courseId]/assignments/[assignmentId]/grade` | Grade assignment |
| `instructor/courses/[courseId]/gradebook` | Course gradebook |
| `instructor/dashboard` | Instructor dashboard |
| `instructor/documents` | Instructor documents |
| `instructor/gradebook` | Instructor gradebook |
| `instructor/programs` | Instructor programs |
| `instructor/programs/[programId]/announcements` | Program announcements |
| `instructor/settings` | Instructor settings |
| `instructor/students` | Instructor students |
| `instructor/students/new` | New student |
| `instructor/submissions` | Instructor submissions |
| `instructor/submissions/[submissionId]` | Submission detail |
| `instructors/performance` | Instructor performance |
| `jobs/new` | Create new job |
| `jri/participants/new` | New JRI participant |
| `learning-paths/new` | Create learning path |
| `license-requests` | License requests |
| `live-chat` | Live chat |
| `mission-control` | Mission control dashboard |
| `modules/new` | Create new module |
| `proctor-portal` | Proctor portal |
| `programs/new` | Create new program |
| `signatures/new` | Create signature |
| `social-media/campaigns/new` | New social campaign |
| `staff` | Staff management |
| `store/clones` | Store clones |
| `studio/courses` | Course studio |
| `studio/courses/[courseId]` | Course detail |
| `studio/courses/[courseId]/content` | Course content |
| `studio/courses/[courseId]/edit` | Edit course |
| `studio/courses/[courseId]/inspect` | Inspect course |
| `studio/courses/[courseId]/quizzes` | Course quizzes |
| `studio/courses/[courseId]/quizzes/[quizId]` | Quiz detail |
| `studio/courses/[courseId]/quizzes/[quizId]/questions` | Quiz questions |
| `studio/courses/bulk-operations` | Bulk course operations |
| `studio/courses/create` | Create course |
| `studio/courses/generate` | Generate course |
| `studio/courses/partners` | Partner courses |
| `studio/courses/pipeline` | Course pipeline |
| `submissions/opportunities` | Submission opportunities |
| `submissions/opportunities/[id]` | Opportunity detail |
| `wioa/new` | Create WIOA record |
| `workflows/new` | Create workflow |
| `wotc/new` | Create WOTC record |

### Total Missing from app/admin: ~85 routes

---

## MISSING FROM apps/admin (in app/admin but not in apps/admin)

| Route | Notes |
|-------|-------|
| `page.tsx` | Root index page (app/admin/page.tsx) |

**Total Missing from apps/admin: 1 route**

---

## DUPLICATE ROUTES (exist in both)

Both locations have the same 296 routes:

```
accreditation, accreditation/report, accreditation/standards/[id], activity, 
advanced-tools, affiliates, analytics, analytics/employers, analytics/engagement, 
analytics/learning, analytics/programs, analytics/revenue, api-keys, applications, 
applications/review/[id], apprenticeships, at-risk, audit-logs, autopilot, 
barber-shop-applications, barber-shop-applications/[id], barriers, billing, 
billing/addons, billing/feature-flags, billing/invoices, billing/licenses, 
billing/plans, billing/subscriptions, billing/usage, blog, certificates, 
certificates/bulk, certificates/issue, cmi, cohorts, compliance, compliance/automation, 
compliance/deletions, compliance/exports, compliance/financial-assurance, 
compliance/wioa-etpl, compliance/wioa-etpl/[programId], 
compliance/wioa-etpl/[programId]/initial-eligibility-aggregate-performance, 
compliance/wioa-etpl/[programId]/section-188-equal-opportunity-checklist, content, 
contracts, contracts/[id], contracts/[id]/export, contracts/[id]/prefill, 
contracts/[id]/sign, course-import, credentials, credentials/[credentialId], crm, 
crm/appointments, crm/campaigns, crm/contacts, crm/deals, crm/follow-ups, crm/leads, 
crm/leads/[id], curriculum, curriculum/[courseId], curriculum/upload, dashboard, 
dashboard/etpl, dashboard/program-integrity, data-import, delegates, docs, docs/mou, 
documents, documents/[id], documents/[id]/map, documents/print, documents/review, 
documents/review/[id], documents/upload, employers, employers/[id], 
employers/[id]/proposal, employers/onboarding, enrollment-jobs, enrollments, 
enrollments/[id], exam-authorizations, external-course-completions, external-progress, 
ferpa, ferpa/access-requests, ferpa/audit-log, ferpa/consent-forms, ferpa/directory-info, 
ferpa/training, files, funding, funding-verification, governance, 
governance/authoritative-docs, governance/compliance, governance/contact, governance/data, 
governance/legal, governance/operational-controls, governance/security, governance/seo-indexing, 
gradebook, gradebook/[courseId], grants, grants/applications, grants/applications/[id], 
grants/intake, grants/opportunities, grants/revenue, grants/snap-et, grants/submissions, 
grants/workflow, home, host-shop/dashboard, hr, hr/employees, hr/employees/[id], hr/leave, 
hr/payroll, hr/time, inbox, incentives, incentives/create, integrations, integrations/calendly, 
integrations/env-manager, integrations/gemini, integrations/google-classroom, 
integrations/quickbooks, integrations/salesforce, integrations/stripe, integrations/teams, 
intelligence, intelligence/forecast, internal-docs, jobs, jri, jri/participants, jri/reports, 
learning-paths, licenses, licenses/create, marketplace, marketplace/creators, 
marketplace/payouts, marketplace/products, migrations, modules, monitoring, monitoring/setup, 
mou, notifications, operations, partner-enrollments, partner-inquiries, partners, 
partners/applications, partners/applications/[id], partners/lms-integrations, 
partners/lms-integrations/[id], payout-queue, payroll-cards, platform, 
program-holder-acknowledgements, program-holder-documents, program-holders, 
program-holders/[id], program-holders/[id]/countersign-mou, program-holders/verification, 
program-holders/verification/[id]/review, programs, programs/[code], 
programs/[code]/certificates, programs/[code]/completion, programs/[code]/courses, 
programs/[code]/dashboard, programs/[code]/enrollments, programs/[code]/manage, 
programs/[code]/media, programs/catalog, promo-codes, provider-applications, providers, 
providers/[tenantId], quizzes, rapids, referrals, reports, reports/caseload, reports/charts, 
reports/enrollment, reports/financial, reports/leads, reports/partners, reports/samples, 
reports/users, reports/wioa, review-queue, review-queue/[id], settings, settings/email, 
settings/general, settings/integrations, settings/nav, settings/notifications, 
settings/organization-profile, settings/payments, settings/security, settings/site-stats, 
settings/social-media, shops, shops/geocoding, signatures, site-audit, snapshots, 
staff-portal, staff-portal/attendance, staff-portal/attendance/export, 
staff-portal/attendance/record, staff-portal/attendance/take, staff-portal/booth-renters, 
staff-portal/campaigns, staff-portal/cases, staff-portal/cases/[id], staff-portal/courses, 
staff-portal/courses/create, staff-portal/customer-service, staff-portal/dashboard, 
staff-portal/processes, staff-portal/qa-checklist, staff-portal/skills, staff-portal/students, 
staff-portal/students/add, staff-portal/training, staff-portal/users, store, store/catalog, 
student-access, student-hours, students, students/[id], students/export, studio, studio/agents, 
studio/builds, studio/deployments, studio/media, studio/memory, studio/pages, studio/settings, 
studio/tasks, studio/workflows, submissions, submissions/attachments, submissions/compliance, 
submissions/content, submissions/exceptions, submissions/facts, submissions/org, 
submissions/partners, submissions/past-performance, submissions/templates, system, system-health, 
system/jobs, system/webhooks, tenants, tenants/[id], testing-center, timeclock, transfer-hours, 
verifications, verifications/review, verifications/review/[id], video-generator, videos, 
videos/upload, waitlist, wioa, wioa/documents, wioa/eligibility, wioa/iep, wioa/iep/[id], 
wioa/verify, workflows, workflows/[id], workone-queue, wotc
```

---

## MERGE RECOMMENDATION

### Option A: Use apps/admin as canonical (RECOMMENDED)

**Rationale:**
- Has MORE features (85 additional routes)
- Has `studio/courses/*` which app/admin doesn't have
- Has `instructor/*` management routes
- Has `fssa-impact/*` tracking
- Has `email-marketing/*`
- Has `dev-studio`, `mission-control`, `live-chat`
- Has more `/new` create routes for all major entities

**Action:**
1. Migrate all `/admin/*` links to `/apps/admin/*`
2. Copy any unique features from `app/admin` to `apps/admin`
3. Delete `app/admin/` directory (297 pages)
4. Keep `apps/admin/` as canonical (381 pages)

**Pages saved:** 297 pages

### Option B: Use app/admin as canonical

**Rationale:**
- Cleaner URL structure (`/admin/*` vs `/apps/admin/*`)
- Already linked from various places

**Action:**
1. Copy all 85 missing features from `apps/admin` to `app/admin`
2. Delete `apps/admin/` directory (381 pages)
3. Keep `app/admin/` as canonical

**Pages saved:** 381 pages

---

## PROPOSED MERGE PLAN (Option A - Recommended)

### Step 1: Audit apps/admin features
Verify these routes are working:
- `studio/courses/*`
- `instructor/*`
- `fssa-impact/*`
- `email-marketing/*`

### Step 2: Copy unique features
If any features in `app/admin` are NOT in `apps/admin`, copy them.

### Step 3: Update all links
Find and update all references from `/admin/*` to `/apps/admin/*`

### Step 4: Delete app/admin
Remove `app/admin/` directory

### Step 5: Update middleware
Ensure middleware handles `/apps/admin/*` routes correctly

---

## UNIQUE TO app/admin (copy to apps/admin if keeping app/admin)

| Route | Purpose |
|-------|---------|
| (none significant) | apps/admin has superset |

---

## CONCLUSION

**apps/admin is the superset** with 85 more routes covering:
- Course studio
- Instructor management  
- FSSA impact tracking
- Email marketing
- Developer tools
- More "create new" routes

**Recommendation:** Merge into `apps/admin` as canonical, delete `app/admin`.

---

*Report generated by OpenHands - June 24, 2026*
