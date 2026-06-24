# API & DEAD CODE AUDIT REPORT

**Date:** 2026-06-24  
**Status:** COMPLETE

---

## 1,030 API ROUTES BREAKDOWN

### Top API Categories

| Category | Count | Notes |
|----------|-------|-------|
| PWA | 60 | Mobile app APIs |
| Store | 44 | E-commerce |
| Cron | 40 | Scheduled tasks |
| Program Holder | 31 | Program management |
| Admin | 30 | Admin panel |
| Auth | 29 | Authentication |
| Franchise | 26 | Franchise system |
| Checkout | 12 | Payment flows |
| Testing | 12 | Exam systems |
| Webhooks | 12 | External integrations |

### Critical/Sensitive APIs (Require Review)

| API | Risk | Status |
|-----|------|--------|
| `/api/secrets` | HIGH | SAMPLE CODE - not for production |
| `/api/generate-video` | HIGH | Expensive - needs auth |
| `/api/debug` | HIGH | Returns 410 - DISABLED ✅ |
| `/api/exec` | CRITICAL | Shell execution - needs review |
| `/api/seed` | CRITICAL | Database seeding - admin only |
| `/api/deploy` | HIGH | Deployment trigger - needs auth |

### Dev/Test APIs (Should Be Disabled)

| API | Status |
|-----|--------|
| `/api/debug` | ✅ Returns 410 (disabled) |
| `/api/dev` | ⚠️ Needs review |
| `/api/test-*` | ⚠️ Needs review |

---

## POTENTIALLY ORPHANED PAGES

These pages exist but may not be linked from anywhere:

### High Priority (May Have Business Value)

| Page | Action |
|------|--------|
| `/for-students` | Add to navigation or delete |
| `/billing` | Add to navigation or delete |
| `/payment-error` | Keep (redirect target) |
| `/ai-chat` | Add to navigation or delete |

### Medium Priority (Store/Apps)

| Page | Action |
|------|--------|
| `/creator/*` | Review - may be unused |
| `/apps/*` | Review - SaaS features |
| `/schools/*` | Review - may be legacy |

### Low Priority (Auth/Invite)

| Page | Action |
|------|--------|
| `/apps/website-builder/*` | Review - new feature? |
| `/apps/sam-gov/*` | Review - integration |
| `/apps/grants/*` | Review - integration |

---

## EMPTY ROUTE GROUPS

These are **valid** route groups (used for layout sharing):

| Group | Purpose |
|-------|---------|
| `(auth)` | Auth layout - contains `/invite` |
| `(marketing)` | Marketing layout |
| `(partner)` | Partner layout |
| `(public)` | Public layout |
| `lms/(app)` | LMS app layout |

---

## RECOMMENDATIONS

### Immediate Actions

1. **Review `/api/secrets`** - Contains sample code, not production-ready
2. **Review `/api/exec`** - Shell execution is dangerous
3. **Review `/api/seed`** - Database operations need protection
4. **Audit `/api/generate-video`** - Expensive operation

### Short Term

1. **Add orphaned pages to sitemap** or create links:
   - `/for-students`
   - `/billing`
   - `/ai-chat`
   - `/creator`

2. **Delete or redirect unused pages:**
   - Test pages not linked
   - Legacy store pages
   - Old landing pages

### Long Term

1. **Consolidate similar APIs:**
   - Multiple enrollment APIs (9+)
   - Multiple checkout APIs (12)
   - Multiple program APIs (16)

2. **Remove dead code:**
   - Legacy test endpoints
   - Unused integrations
   - Old A/B test code

---

## FILES CREATED

| File | Purpose |
|------|---------|
| `AUDIT_REPORT.md` | Detailed audit report |
| `AUDIT_REPORT_FINAL.md` | Executive summary |
| `ROUTE_RENAMING_GUIDE.md` | 72 route rename instructions |
| `API_AUDIT_REPORT.md` | This file |

---

**Audit Completed:** 2026-06-24
