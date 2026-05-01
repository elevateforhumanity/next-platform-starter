# Workforce Pipeline Audit — Elevate LMS

## Audit Date: 2026-04-30

---

## 1. CRITICAL FAILURES (fix immediately)

### 1a. Intake missing WIOA-required fields
**File:** `app/apply/intake/page.tsx`, `app/api/intake/route.ts`

The intake form collects: name, email, phone, city, state, program, employment status, funding needed, probation/reentry, workforce connection, referral source.

**Missing fields required for WIOA/FSSA eligibility determination:**
- Date of birth (age eligibility gate)
- County of residence (Indiana DWD county-level reporting)
- Income level / household size (WIOA income threshold)
- SNAP/TANF/SSI receipt (categorical eligibility)
- Barriers to employment (WIOA barrier categories: homeless, ex-offender, veteran, disability, etc.)
- Citizenship/work authorization status

Without these, `determineFundingTag()` in `app/api/intake/route.ts` can only produce `wioa`, `jri`, `self-pay`, or `pending-review` — it cannot determine categorical eligibility, and every WIOA-funded participant will require manual review.

### 1b. Status pipeline terminates at `enrolled` — no post-enrollment lifecycle
**File:** `app/api/admin/applications/transition/route.ts`

`VALID_TRANSITIONS` ends at `enrolled: []`. There are no transitions for:
- `active_apprentice`
- `completed`
- `placed`
- `exited`

This means once a student is enrolled, the application record is frozen. Placement, completion, and exit data cannot be tracked through the application lifecycle. WIOA performance reporting (employment at 2nd quarter after exit) is impossible without this.

### 1c. Eligibility engine is manual-only for SNAP/barrier categories
**File:** `app/api/intake/route.ts` → `determineFundingTag()`

The auto-tagging function only checks `probation_or_reentry` and `workforce_connection`. SNAP, TANF, income level, and barrier categories are not collected at intake and therefore cannot be auto-tagged. Every participant requiring categorical WIOA eligibility requires a human reviewer. At scale this is a bottleneck that will break the pipeline.

### 1d. Mentor/supervisor hour verification has no UI in the partner portal
**Files:** `app/(partner)/partners/attendance/page.tsx`, `app/api/apprenticeship/hours/approve/route.ts`

The API for approving hours exists (`/api/apprenticeship/hours/approve`, `/api/time/approve`). The partner attendance page only allows entering weekly hours by day — it does **not** show pending hour entries submitted by apprentices for mentor approval. Shop owners/mentors have no interface to review and sign off on apprentice-submitted hours. Hours approval currently requires admin access.

### 1e. Scheduling is not linked to the applicant lifecycle
**Files:** `app/api/schedule-consultation/route.ts`, `app/schedule/select/page.tsx`

The consultation scheduling API creates a Zoom meeting and sends an email but does **not** write an appointment record linked to the applicant's `applications` row. There is no `appointments` table FK to `applications.id`. Attendance (attended/no-show) is never recorded. The applicant status does not advance from `submitted` → `scheduled` when a consultation is booked.

---

## 2. STRUCTURAL WEAKNESSES (will break at scale)

### 2a. Fragmented hours tables — 9 separate tables, no canonical source
The schema contains: `hour_entries`, `apprenticeship_hours`, `apprentice_hours`, `apprentice_hours_log`, `ojt_hours_log`, `apprenticeship_hours_summary`, `apprentice_hour_totals`, `apprentice_hours_by_shop`, `apprentice_hours_by_source`.

Code writes to `hour_entries` (canonical per `app/api/apprenticeship/hours/route.ts`) but the partner portal attendance page writes to `apprentice_placements` and reads from `checkin_sessions`. The admin hours export reads from `ojt_hours_log`. These are not the same table. Totals will never reconcile.

### 2b. Referral system is affiliate/marketing-only — no workforce referral routing
**File:** `app/api/referrals/route.ts`

The referral API is a discount/affiliate system (referral codes, payouts, leaderboard). It is not a workforce referral system. The `workforce_referrals` table exists in migrations but has no API routes, no admin UI, and no linkage to `applications`. Agency referrals (WorkOne, FSSA, community orgs) cannot be tracked as structured records with provider assignment and confirmation.

### 2c. Partner portal has no hour-logging interface for apprentices
**File:** `app/(partner)/partners/`

The partner portal has: dashboard, attendance (weekly grid entry), documents, students list. It does **not** have:
- A view of pending hour entries submitted by apprentices
- Approve/reject controls for individual hour entries
- A mentor sign-off workflow
- Any link to `hour_entries` table

### 2d. No native scheduling — Calendly dependency for orientation
Orientation scheduling links to Calendly. There is no native booking system that ties appointment records to applicant records. `app/schedule/select/page.tsx` shows schedule options (day/evening/self-paced) but the server action only writes a `schedule_preference` to the user's profile — it does not create a bookable appointment slot or track attendance.

### 2e. `applications` and `program_enrollments` are parallel, not linked
An applicant can exist in `applications` without a corresponding `program_enrollments` row, and vice versa. The transition from `approved` → `enrolled` in the application pipeline does not guarantee a `program_enrollments` row is created. This causes the admin enrollment dashboard and the application pipeline to show different counts for the same cohort.

---

## 3. COMPLIANCE RISKS (FSSA/WIOA)

### 3a. No DOB = no age eligibility gate
WIOA Title I Adult/Dislocated Worker requires age ≥ 18. WIOA Youth requires 14–24. Without DOB at intake, age eligibility cannot be enforced or reported.

### 3b. No county = no Indiana DWD regional reporting
Indiana DWD requires participant counts by Local Workforce Development Area (LWDA). County of residence maps to LWDA. Without county, WIOA performance reports cannot be disaggregated by region.

### 3c. No barrier tracking = incomplete WIOA participant record
WIOA requires tracking of barriers (homeless, ex-offender, low-income, basic skills deficient, English language learner, etc.) for performance reporting. `participant_barriers` table exists in migrations but is not populated from intake.

### 3d. RAPIDS reporting has no automated feed
`rapids_apprentice_data` and `rapids_apprentices` tables exist. The admin RAPIDS page exists. But there is no automated sync from `hour_entries` or `apprenticeship_enrollments` to RAPIDS format. DOL-registered apprenticeships require quarterly RAPIDS reporting. This is currently manual.

### 3e. No exit/outcome recording closes the WIOA performance loop
WIOA measures: entered employment rate, employment retention at 2nd quarter, median earnings, credential attainment. None of these can be computed because:
- Application status stops at `enrolled`
- `employment_outcomes` table exists but has no API route to populate it from the student-facing flow
- Placement is recorded in `job_placements` / `placement_records` / `apprentice_placements` (three tables, no canonical one)

---

## 4. MISSING FEATURES (required for full pipeline)

| Feature | Status | Impact |
|---|---|---|
| DOB / county / income / SNAP fields on intake form | Missing | Blocks WIOA eligibility auto-determination |
| Auto-eligibility engine (SNAP/barrier/income rules) | Partial (only JRI/WorkOne) | Every participant needs manual review |
| Native appointment booking tied to applicant record | Missing | No attendance tracking, no lifecycle advance |
| Post-enrollment status transitions (active → completed → placed) | Missing | Pipeline dead-ends at enrolled |
| Workforce referral records (agency → applicant linkage) | Missing | No referral tracking for WorkOne/FSSA |
| Mentor hour-approval UI in partner portal | Missing | Hours approval requires admin |
| Canonical hours table with single write path | Fragmented (9 tables) | Totals never reconcile |
| RAPIDS automated export | Manual only | DOL quarterly reporting risk |
| Employment outcome recording from student flow | Missing | WIOA performance metrics unavailable |
| Unified placement table | Fragmented (3 tables) | Placement rate cannot be computed |

---

## 5. EXACT FIXES (file names and approach)

### Fix 1 — Add WIOA fields to intake form
**Files:** `app/apply/intake/page.tsx`, `app/api/intake/route.ts`

Add to form: `date_of_birth`, `county`, `household_size`, `income_level`, `snap_recipient` (boolean), `tanf_recipient` (boolean), `barriers[]` (multi-select).

Add to `determineFundingTag()`:
```ts
if (body.snap_recipient === 'true' || body.tanf_recipient === 'true') return 'wioa-categorical';
if (parseInt(body.household_size) <= 2 && parseInt(body.income_level) < 20000) return 'wioa-income';
```

Add to `apprenticeship_intake` INSERT: all new fields.

Migration: `ALTER TABLE apprenticeship_intake ADD COLUMN IF NOT EXISTS date_of_birth DATE, county TEXT, household_size INT, income_level INT, snap_recipient BOOLEAN DEFAULT false, tanf_recipient BOOLEAN DEFAULT false, barriers TEXT[] DEFAULT '{}'`

### Fix 2 — Extend status pipeline past `enrolled`
**File:** `app/api/admin/applications/transition/route.ts`

```ts
const VALID_TRANSITIONS = {
  ...existing,
  enrolled: ['active_apprentice', 'withdrawn'],
  active_apprentice: ['completed', 'withdrawn'],
  completed: ['placed', 'exited'],
  placed: ['exited'],
  withdrawn: [],
  exited: [],
};
```

### Fix 3 — Link consultation booking to applicant record
**File:** `app/api/schedule-consultation/route.ts`

After creating the Zoom meeting, write to a `consultations` table:
```ts
await supabase.from('consultations').insert({
  applicant_email: email,
  appointment_type,
  appointment_date,
  appointment_time,
  zoom_url: zoomUrl,
  status: 'scheduled',
});
```

If `application_id` is passed, also update `applications.status = 'scheduled'`.

Migration: `CREATE TABLE IF NOT EXISTS consultations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), applicant_email TEXT NOT NULL, application_id UUID REFERENCES applications(id), appointment_type TEXT, appointment_date DATE, appointment_time TEXT, zoom_url TEXT, status TEXT DEFAULT 'scheduled', attended_at TIMESTAMPTZ, no_show_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now())`

### Fix 4 — Add mentor hour-approval UI to partner portal
**New file:** `app/(partner)/partners/hours/page.tsx`

Query `hour_entries` where `status = 'pending'` and `program_slug` matches the partner's assigned programs. Show each entry with Approve/Reject buttons that call `/api/apprenticeship/hours/approve`.

### Fix 5 — Canonicalize hours to `hour_entries` only
**Files:** `app/(partner)/partners/attendance/page.tsx`

Replace the weekly grid that writes to `apprentice_placements` with a form that POSTs to `/api/apprenticeship/hours` (which writes to `hour_entries`). Deprecate direct writes to `ojt_hours_log` and `apprenticeship_hours`.

### Fix 6 — Add workforce referral records
**New file:** `app/api/workforce-referrals/route.ts`

```ts
// POST: create referral record
// GET: list referrals by applicant or agency
// PATCH: update status (referred, contacted, enrolled, declined)
```

Table: `workforce_referrals` (already in migrations) — wire it to the intake flow so that `referral_source = 'workone'` creates a `workforce_referrals` row with `agency = 'workone'`, `applicant_id`, `status = 'referred'`.

### Fix 7 — Employment outcome recording
**New file:** `app/api/outcomes/route.ts`

POST endpoint that writes to `employment_outcomes`:
```ts
{ user_id, program_slug, outcome_type: 'employed'|'credential'|'military'|'education', employer_name, job_title, hourly_wage, start_date }
```

Wire to admin student detail page and to the learner dashboard post-completion flow.

---

## Implementation Priority Order

1. **Fix 1** — WIOA intake fields (blocks all compliance reporting)
2. **Fix 2** — Status pipeline extension (blocks placement/outcome tracking)
3. **Fix 3** — Consultation booking → applicant linkage (blocks attendance tracking)
4. **Fix 4** — Mentor hour-approval UI (blocks partner self-service)
5. **Fix 6** — Workforce referral records (blocks agency tracking)
6. **Fix 7** — Employment outcome recording (blocks WIOA performance metrics)
7. **Fix 5** — Hours table canonicalization (blocks accurate totals)
