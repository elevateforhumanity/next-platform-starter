# Complete Redirect Audit Report

**Date:** June 24, 2026  
**Total Redirect Pages:** ~280 pages

---

## ROOT INDEX REDIRECTS (7 pages)

These are public landing pages that redirect to authenticated dashboards.

| Page | Redirects To | Status | Links |
|------|-------------|--------|-------|
| `/admin` | `/admin/dashboard` | ✅ NEEDED | Links from pwa/admin, breadcrumbs |
| `/mentor` | `/mentor/dashboard` | ✅ NEEDED | backHref reference |
| `/partner` | `/partner/dashboard` | ✅ NEEDED | Public dashboard landing |
| `/portal` | `/portal/apprentice` | ✅ NEEDED | Public dashboard landing |
| `/provider` | `/provider/dashboard` | ✅ NEEDED | Public dashboard landing |
| `/creator` | `/creator/products` | ✅ NEEDED | Public dashboard landing |
| `/employer-portal` | `/employer-portal/candidates` | ✅ NEEDED | Role-gated |

---

## SECTION REDIRECTS (15 pages)

### Workforce/Case Management
| Page | Redirects To | Status |
|------|-------------|--------|
| `/workforce` | `/workforce-board/dashboard` | ⚠️ ORPHAN - No links found |
| `/case-manager` | `/case-manager/dashboard` | ⚠️ ORPHAN - No links found |

### Franchise
| Page | Redirects To | Status |
|------|-------------|--------|
| `/franchise/office` | `/franchise` | ⚠️ REVIEW - Check if needed |
| `/franchise/admin/preparers` | ? | ⚠️ STUB |
| `/franchise/admin/returns` | ? | ⚠️ STUB |
| `/franchise/admin/settings` | ? | ⚠️ STUB |

### Host Shop
| Page | Redirects To | Status |
|------|-------------|--------|
| `/host-shop` | `/host-shop/dashboard` | ✅ NEEDED |
| `/cosmetology-host-shop` | ? | ⚠️ REVIEW |

### Programs
| Page | Redirects To | Status |
|------|-------------|--------|
| `/programs-cdl` | `/programs/cdl-training` | ✅ NEEDED |
| `/apply/[programId]` | ? | ✅ DYNAMIC - Depends on ID |

---

## ADMIN STUB REDIRECTS (9 pages)

### Studio Redirects
| Page | Redirects To | Status | Duplicates |
|------|-------------|--------|------------|
| `/admin/quizzes` | `/admin/studio?tab=courses` | ⚠️ REDIRECT TO STUDIO | Has duplicate in apps/admin |
| `/admin/workflows` | `/admin/studio/workflows` | ⚠️ REDIRECT TO STUDIO | Has duplicate in apps/admin |
| `/admin/studio/agents` | Renders AgentsClient | ✅ NEEDED | apps/admin copy |
| `/admin/studio/builds` | Renders BuildsClient | ✅ NEEDED | apps/admin copy |
| `/admin/studio/deployments` | Renders DeploymentsClient | ✅ NEEDED | apps/admin copy |
| `/admin/studio/memory` | Renders MemoryClient | ✅ NEEDED | apps/admin copy |
| `/admin/studio/settings` | Renders SettingsClient | ✅ NEEDED | apps/admin copy |
| `/admin/studio/tasks` | Renders TasksClient | ✅ NEEDED | apps/admin copy |
| `/admin/studio/workflows` | Renders WorkflowsClient | ✅ NEEDED | apps/admin copy |

### Admin Submissions
| Page | Redirects To | Status |
|------|-------------|--------|
| `/admin/submissions/opportunities/[id]` | ? | ⚠️ REDIRECT STUB |

---

## HELP/DOCS REDIRECTS (4 pages)

| Page | Redirects To | Status |
|------|-------------|--------|
| `/help/articles/certificates` | ? | ✅ HELP PAGE |
| `/help/articles/financial-aid` | ? | ✅ HELP PAGE |
| `/help/articles/how-to-enroll` | ? | ✅ HELP PAGE |
| `/help/articles/reset-password` | ? | ✅ HELP PAGE |

---

## APPRENTICE PORTAL REDIRECTS (17 pages)

### Apprentice Sub-pages
| Page | Redirects To |
|------|-------------|
| `/apprentice` | `/login?redirect=/apprentice` |
| `/apprentice/billing` | `/login?redirect=/apprentice` |
| `/apprentice/competencies` | `/login?redirect=/apprentice` |
| `/apprentice/course` | `/login?redirect=/apprentice` |
| `/apprentice/documents` | `/login?redirect=/apprentice` |
| `/apprentice/hours` | `/login?redirect=/apprentice` |
| `/apprentice/hours/history` | `/login?redirect=/apprentice` |
| `/apprentice/skills` | `/login?redirect=/apprentice` |
| `/apprentice/state-board` | `/login?redirect=/apprentice` |
| `/apprentice/timeclock/history` | `/login?redirect=/apprentice` |
| `/apprentice/transfer-hours` | `/login?redirect=/apprentice` |
| `/apprentice/transfer-hours/request` | `/login?redirect=/apprentice` |
| `/apprentice/workbook` | `/login?redirect=/apprentice` |

**Status:** ✅ NEEDED - Authenticated portal routes

---

## ACCOUNT REDIRECTS (7 pages)

| Page | Redirects To |
|------|-------------|
| `/account` | `/login?redirect=/account` |
| `/account/addons` | `/login?redirect=/account` |
| `/account/licenses` | `/login?redirect=/account` |
| `/account/plan` | `/login?redirect=/account` |
| `/account/profile` | `/login?redirect=/account` |
| `/account/settings` | `/login?redirect=/account` |
| `/account/settings/*` | `/login?redirect=/account` |

**Status:** ✅ NEEDED - Authenticated account routes

---

## EMPLOYER PORTAL REDIRECTS (13 pages)

| Page | Redirects To |
|------|-------------|
| `/employer-portal` | `/employer-portal/candidates` |
| `/employer-portal/analytics` | `/login?redirect=/employer-portal/analytics` |
| `/employer-portal/applications` | `/login?redirect=/employer-portal/applications` |
| `/employer-portal/candidates` | `/login?redirect=/employer-portal/candidates` |
| `/employer-portal/company` | `/login?redirect=/employer-portal/company` |
| `/employer-portal/interviews` | `/login?redirect=/employer-portal/interviews` |
| `/employer-portal/jobs` | `/login?redirect=/employer-portal/jobs` |
| `/employer-portal/messages` | `/login?redirect=/employer-portal/messages` |
| `/employer-portal/settings` | `/login?redirect=/employer-portal/settings` |

**Status:** ✅ NEEDED - Employer portal routes

---

## LMS REDIRECTS (56 pages)

All LMS sub-pages redirect to `/login?redirect=/lms/...`

### LMS Core (56 pages)
- `/lms/*` - All protected routes
- LMS sub-pages: achievements, adaptive, analytics, assignments, attendance, badges, calendar, certificates, certification, chat, collaborate, enroll, files, grades, help, integrations, leaderboard, learning-paths, library, messages, notifications, orientation, payments, peer-review, placement, portfolio, profile, progress, programs, quizzes, resources, schedule, scorm, settings, support, video

**Status:** ✅ NEEDED - Core LMS functionality

---

## PARTNER PORTAL REDIRECTS (10 pages)

| Page | Redirects To |
|------|-------------|
| `/partner` | `/partner/dashboard` |
| `/partner/attendance` | `/login?redirect=/partner/attendance` |
| `/partner/attendance/record` | `/login?redirect=/partner/attendance` |
| `/partner/board` | `/login?redirect=/partner/board` |
| `/partner/dashboard` | `/login?redirect=/partner/dashboard` |
| `/partner/hours` | `/login?redirect=/partner/hours` |
| `/partner/programs` | `/login?redirect=/partner/programs` |
| `/partner/programs/[program]` | `/login?redirect=/partner/programs` |
| `/partner/settings` | `/login?redirect=/partner/settings` |
| `/partner/students` | `/login?redirect=/partner/students` |

**Status:** ✅ NEEDED - Partner portal routes

---

## MENTOR REDIRECTS (3 pages)

| Page | Redirects To |
|------|-------------|
| `/mentor` | `/mentor/dashboard` |
| `/mentor/mentees` | `/login?redirect=/mentor/mentees` |
| `/mentor/sessions` | `/login?redirect=/mentor/sessions` |

**Status:** ✅ NEEDED - Mentor portal routes

---

## PROVIDER REDIRECTS (5 pages)

| Page | Redirects To |
|------|-------------|
| `/provider` | `/provider/dashboard` |
| `/provider/compliance` | `/login?redirect=/provider/compliance` |
| `/provider/dashboard` | `/login?redirect=/provider/dashboard` |
| `/provider/programs` | `/login?redirect=/provider/programs` |
| `/provider/settings` | `/login?redirect=/provider/settings` |

**Status:** ✅ NEEDED - Provider portal routes

---

## ONBOARDING REDIRECTS (12 pages)

| Page | Redirects To |
|------|-------------|
| `/onboarding` | `/onboarding` |
| `/onboarding/employer` | `/login?redirect=/onboarding/employer` |
| `/onboarding/instructor` | `/login?redirect=/onboarding/instructor` |
| `/onboarding/learner` | `/login?redirect=/onboarding/learner` |
| `/onboarding/payroll-setup` | `/login?redirect=/onboarding/payroll-setup` |
| `/onboarding/school` | `/login?redirect=/onboarding/school` |

**Status:** ✅ NEEDED - Onboarding flow routes

---

## HUB REDIRECTS (6 pages)

| Page | Redirects To |
|------|-------------|
| `/hub` | `/hub/welcome` |
| `/hub/calendar` | `/login?redirect=/hub/calendar` |
| `/hub/classroom` | `/login?redirect=/hub/classroom` |
| `/hub/leaderboard` | `/login?redirect=/hub/leaderboard` |
| `/hub/members` | `/login?redirect=/hub/members` |
| `/hub/welcome` | `/login?redirect=/hub/welcome` |

**Status:** ✅ NEEDED - Community hub routes

---

## FERPA REDIRECTS (7 pages)

| Page | Redirects To |
|------|-------------|
| `/ferpa` | `/login?redirect=/ferpa` |
| `/ferpa/calendar` | `/login?redirect=/ferpa/calendar` |
| `/ferpa/compliance` | `/login?redirect=/ferpa/compliance` |
| `/ferpa/documentation` | `/login?redirect=/ferpa/documentation` |
| `/ferpa/help` | `/login?redirect=/ferpa/help` |
| `/ferpa/records` | `/login?redirect=/ferpa/records` |
| `/ferpa/requests` | `/login?redirect=/ferpa/requests` |

**Status:** ✅ NEEDED - FERPA compliance routes

---

## EMPLOYEE REDIRECTS (6 pages)

| Page | Redirects To |
|------|-------------|
| `/employee` | `/login?redirect=/employee` |
| `/employee/documents` | `/login?redirect=/employee/documents` |
| `/employee/handbook` | `/login?redirect=/employee/handbook` |
| `/employee/payroll` | `/login?redirect=/employee/payroll` |
| `/employee/time-off` | `/login?redirect=/employee/time-off` |

**Status:** ✅ NEEDED - Employee portal routes

---

## LEGAL REDIRECTS (3 pages)

| Page | Redirects To |
|------|-------------|
| `/legal/nda` | `/login?redirect=/legal/nda` |
| `/legal/non-compete` | `/login?redirect=/legal/non-compete` |
| `/legal/program-holder-mou` | `/login?redirect=/legal/program-holder-mou` |

**Status:** ✅ NEEDED - Legal document routes

---

## SHOP/STORE REDIRECTS (9 pages)

| Page | Redirects To | Status |
|------|-------------|--------|
| `/shop/orders` | ? | ⚠️ REVIEW |
| `/shop/product/[slug]` | ? | ⚠️ REVIEW |
| `/store/orders` | ? | ⚠️ REVIEW |
| `/store/demo` | ? | ❌ DELETE - Demo only |
| `/store/licensing/checkout/[slug]` | ? | ⚠️ REVIEW |
| `/store/checkout` | ? | ⚠️ REVIEW |
| `/store/success` | ? | ⚠️ REVIEW |
| `/store/request-license` | ? | ⚠️ REVIEW |

---

## DEMO/DEV REDIRECTS (6 pages)

| Page | Status | Recommendation |
|------|--------|----------------|
| `/demo/admin/dashboard` | Demo only | ❌ DELETE |
| `/demo/tour/[tourId]` | Demo tour | ⚠️ REVIEW |
| `/apps` | Redirects to /login | ✅ NEEDED |
| `/apps/grants` | Redirects | ⚠️ REVIEW |
| `/apps/website-builder` | Redirects | ⚠️ REVIEW |
| `/apps/sam-gov` | Redirects | ⚠️ REVIEW |

---

## MISC REDIRECTS (15 pages)

| Page | Redirects To | Status |
|------|-------------|--------|
| `/accept-invite` | `/c/${params.token}` | ✅ NEEDED |
| `/analytics` | `/login?redirect=/analytics` | ✅ NEEDED |
| `/billing` | `/login?redirect=/billing` | ✅ NEEDED |
| `/card` | `/login?redirect=/card` | ✅ NEEDED |
| `/checkout` | ? | ⚠️ REVIEW |
| `/dashboard` | `/login?redirect=/dashboard` | ✅ NEEDED |
| `/documents` | `/login?redirect=/documents` | ✅ NEEDED |
| `/file-manager` | `/login?redirect=/file-manager` | ✅ NEEDED |
| `/instructor/[...path]` | `/login?redirect=/instructor` | ✅ NEEDED |
| `/learner` | `/learner/dashboard` | ✅ NEEDED |
| `/license/onboarding` | `/login?redirect=/license/onboarding` | ✅ NEEDED |
| `/messages` | `/login?redirect=/messages` | ✅ NEEDED |
| `/notifications` | `/login?redirect=/notifications` | ✅ NEEDED |
| `/profile/edit` | `/login?redirect=/profile/edit` | ✅ NEEDED |
| `/reports` | `/login?redirect=/reports` | ✅ NEEDED |

---

## PWA REDIRECTS (4 pages)

| Page | Redirects To | Status |
|------|-------------|--------|
| `/pwa/barber/dashboard` | `/login?redirect=/pwa/barber/dashboard` | ✅ NEEDED |
| `/pwa/shop-owner/dashboard` | `/login?redirect=/pwa/shop-owner/dashboard` | ✅ NEEDED |
| `/pwa/admin/courses` | `/login?redirect=/pwa/admin/courses` | ✅ NEEDED |
| `/pwa/esthetician` | `/login?redirect=/pwa/esthetician` | ✅ NEEDED |
| `/pwa/cosmetology` | `/login?redirect=/pwa/cosmetology` | ✅ NEEDED |
| `/pwa/nail-tech` | `/login?redirect=/pwa/nail-tech` | ✅ NEEDED |

---

## SUMMARY

### By Status

| Status | Count | Pages |
|--------|-------|-------|
| ✅ NEEDED | ~250 | Core portal routes |
| ⚠️ ORPHAN | 2 | /workforce, /case-manager |
| ⚠️ REVIEW | ~20 | Franchise stubs, store pages |
| ⚠️ REDIRECT TO STUDIO | 2 | admin/quizzes, admin/workflows |
| ❌ DELETE | 1 | demo/admin/dashboard |
| ❌ DELETE? | 1 | store/demo |

### Action Items

1. **Verify orphan routes** - `/workforce` and `/case-manager` have no incoming links
2. **Review franchise stubs** - `/franchise/admin/preparers`, `/franchise/admin/returns`, `/franchise/admin/settings`
3. **Review store pages** - Several store/shop pages need review
4. **Clean up demo pages** - Delete `store/demo` and potentially `demo/admin/dashboard`

---

*Report generated by OpenHands*
