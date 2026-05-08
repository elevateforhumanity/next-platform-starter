# Elevate for Humanity — Workforce Operating System

> **Repository Notice**
> This repository is published for transparency, security review, and platform documentation.
> It does not contain the complete production system. External contributions are not accepted.
> Access to the live platform requires a formal managed access or enterprise source-use agreement.

---

**Production:** [elevateforhumanity.org](https://www.elevateforhumanity.org)
**Status:** Live — Indianapolis, Indiana
**Branch:** `main`

---

## What This Is

Elevate for Humanity operates a vertically integrated **Workforce Operating System** — not a course catalog, not a generic LMS. The platform handles the full operational stack for workforce credential delivery:

- **Training delivery** — cohort scheduling, video lessons, quizzes, attendance, progress tracking
- **Enrollment and funding** — WIOA, Workforce Ready Grant, JRI, FSSA IMPACT, and employer-sponsored intake workflows
- **Compliance and reporting** — DOL apprenticeship (RAPIDS), WIOA performance metrics, RTI hour logs, audit trails
- **Credentialing** — EPA 608, OSHA 10/30, CompTIA A+/Security+, PTCB CPhT, NHA, Microsoft Office Specialist, WorkKeys NCRC, Certiport, Indiana ISDH, Indiana BMV
- **Stakeholder portals** — learner, admin, instructor, employer, program holder, partner, mentor, staff, parent/guardian, workforce board
- **Employer pipeline** — job postings, OJT agreements, placement tracking, 6- and 12-month outcome reporting
- **Tax software** — MeF e-filing stack and tax operations

Programs run 4–18 weeks. Most are fully funded at no cost to eligible participants through federal and Indiana state workforce programs.

---

## Who It Serves

| Stakeholder | Role |
|---|---|
| **Adult learners** | Career changers, dislocated workers, justice-involved individuals, youth 16–24 |
| **Workforce agencies** | WorkOne, Indiana DWD, EmployIndy — referring and funding participants |
| **Employers** | Hiring partners, OJT sponsors, apprenticeship co-sponsors |
| **Program holders** | Community organizations delivering training under Elevate's infrastructure |
| **Booth renters** | Licensed cosmetology professionals renting space at partner salons |
| **Workforce boards** | WIOA Title I administrators, EmployIndy, state DWD |
| **Government** | DOL Office of Apprenticeship, WIOA Title I, FSSA, Indiana BMV |
| **Parents / Guardians** | Monitoring progress of enrolled youth participants |

---

## Training Programs

### Healthcare

| Program | Credential | Funding |
|---|---|---|
| Certified Nursing Assistant | Indiana ISDH CNA | WIOA · WRG |
| Qualified Medication Aide (QMA) | Indiana QMA | WIOA · WRG |
| Medical Assistant | NHA CCMA | WIOA · WRG |
| Phlebotomy | NHA CPT | WIOA · WRG |
| Pharmacy Technician | PTCB CPhT | WIOA · WRG |
| Home Health Aide | Indiana HHA | WIOA |
| Peer Recovery Specialist | CPRC Pathway | WIOA · JRI |
| Direct Support Professional | DSP Credential | WIOA |
| Drug & Alcohol Specimen Collector | DOT Collector Cert | Self-Pay · Employer |

### Skilled Trades

| Program | Credential | Funding |
|---|---|---|
| HVAC Technician | EPA Section 608 Universal | WIOA · WRG |
| CDL Training (Class A / B) | Commercial Driver's License | WIOA · EmployIndy |
| Welding | AWS / Industry Cert | WIOA · WRG |
| Electrical | OSHA + Industry Cert | WIOA |
| Plumbing | Industry Cert | WIOA |
| Construction Trades Certification | NCCER / OSHA | WIOA · WRG |
| Building Services Technician | Industry Cert | WIOA |
| Diesel Mechanic | ASE Pathway | WIOA |
| Forklift Operator | OSHA Forklift Cert | WIOA · Employer |

### Technology & Business

| Program | Credential | Funding |
|---|---|---|
| IT Help Desk | CompTIA A+ | WIOA · WRG |
| Cybersecurity Analyst | CompTIA Security+ | WIOA · WRG |
| Network Administration | CompTIA Network+ | WIOA · WRG |
| Network Support Technician | Industry Cert | WIOA |
| Web Development | Portfolio + Cert | WIOA |
| Software Development | Portfolio + Cert | WIOA |
| Graphic Design | Adobe / Portfolio | WIOA |
| CAD / Drafting | AutoCAD Cert | WIOA |
| Business Administration | Industry Cert | WIOA |
| Office Administration | MOS Certification | WIOA · WRG |
| Bookkeeping | QuickBooks / NACPB | WIOA |
| Finance & Accounting Pathway | NACPB / Industry | WIOA |
| Tax Preparation | IRS AFSP / PTIN | Self-Pay · Employer |
| Entrepreneurship | Certificate | WIOA |
| Project Management | CAPM Pathway | WIOA |

### Apprenticeships (DOL Registered)

| Program | License | Funding |
|---|---|---|
| Barber Apprenticeship | Indiana Barber License | DOL Apprenticeship |
| Cosmetology Apprenticeship | Indiana Cosmetology License | DOL Apprenticeship |
| Esthetics Apprenticeship | Indiana Esthetician License | DOL Apprenticeship |
| Nail Technology Apprenticeship | Indiana Nail Tech License | DOL Apprenticeship |
| Beauty Career Educator | Educator Credential | DOL Apprenticeship |
| Culinary Arts Apprenticeship | Industry Cert | DOL Apprenticeship |
| Hospitality | Industry Cert | DOL Apprenticeship |

### Short-Duration Certifications

| Program | Credential | Funding |
|---|---|---|
| CPR / First Aid | AHA / HSI BLS | Self-Pay · Employer |
| OSHA / Emergency Health & Safety | OSHA 10/30 | WIOA · Employer |
| Sanitation & Infection Control | Industry Cert | Self-Pay |

---

## Stakeholder Portals

| Portal | Path | Audience |
|---|---|---|
| Learner LMS | `/lms` | Enrolled students |
| Student Portal | `/student-portal` | Student self-service |
| Admin | `/admin` | Staff, super admins |
| Instructor | `/instructor` | Course instructors |
| Employer Portal | `/employer-portal` | Hiring partners |
| Program Holder | `/program-holder` | Community org partners |
| Partner Portal | `/partners/dashboard` | Apprenticeship host shops |
| Staff Portal | `/staff-portal` | Internal staff |
| Workforce Board | `/workforce-board` | WIOA/DWD administrators |
| Parent Portal | `/parent-portal` | Guardians of youth participants |
| Apprentice | `/apprentice` | Registered apprentices |
| Case Manager | `/cm` | WIOA case managers |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Turbopack) |
| Database | Supabase (PostgreSQL) — project `cuxzzpsyufcewtmicszk` |
| Hosting | Netlify + `@netlify/plugin-nextjs` |
| Package manager | pnpm |
| Auth | Supabase Auth + custom role system |
| Payments | Stripe + Affirm |
| Email | Resend |
| Rate limiting | Upstash Redis |
| Storage | Cloudflare R2 |
| Analytics | Google Analytics (G-SWPG2HVYVH) |
| Tax e-filing | IRS MeF stack (EFIN 358459) |

---

## Repository Scale

| Metric | Count |
|---|---|
| `page.tsx` files | 1,545 |
| `route.ts` API files | 1,122 |
| Supabase migrations | 597 |
| Canonical programs | 37 |
| Nav hrefs | 111 |

---

## Common Commands

```bash
pnpm next dev --turbopack   # Start dev server (port 3000)
pnpm next build             # Production build — must complete with zero errors
pnpm lint                   # Run ESLint
```

---

## Key Directories

```
app/                        Next.js App Router pages
components/                 Reusable UI components
lib/                        Shared utilities, Supabase clients, navigation
lib/navigation.ts           Single source of truth for header nav (111 hrefs)
lib/routes/canonical-routes.json  Canonical program URL registry
lib/curriculum/             Blueprint system and course generator
lib/tax-software/           MeF tax stack
data/programs/              Program data objects (metadata, content, CTAs)
supabase/migrations/        SQL migration files (applied manually in Dashboard)
netlify/functions/          Serverless functions
public/images/              All site images
scripts/                    Build guards, audit scripts, seeders
```

---

## Navigation Structure

The public header nav (`lib/navigation.ts`) covers 8 top-level sections:

1. **Programs** — 37 canonical programs across Healthcare, Skilled Trades, Technology & Business, and Hubs
2. **Apprenticeships** — DOL-registered programs, booth rental, host shop partners
3. **Certifications** — Short-duration credentials + testing/verification
4. **Funding** — WIOA, WRG, FSSA, JRI, grant programs, payment options
5. **Partners** — Employers, workforce agencies, training providers, program holders
6. **About** — Mission, team, impact, blog, FAQ, contact, advising
7. **Apply** — Single funnel entry point
8. **Donate**

---

## Migrations

Files go in `supabase/migrations/`. Naming: `YYYYMMDD000NNN_description.sql`.

**Migrations are NOT auto-applied.** After writing a migration file:
1. Open Supabase Dashboard → SQL Editor
2. Paste and run the migration manually
3. Verify the schema change before marking work complete

---

## Auth & API Patterns

```ts
// Authenticated user
import { apiAuthGuard } from '@/lib/admin/guards';
const auth = await apiAuthGuard(request);
if (auth.error) return auth.error;

// Admin routes
import { apiRequireAdmin } from '@/lib/admin/guards';
const auth = await apiRequireAdmin(request);
if (auth.error) return auth.error;
```

All API error responses use `lib/api/safe-error.ts`:
```ts
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
return safeError('Not found', 404);
```

---

## Funding

Elevate for Humanity is a 501(c)(3) nonprofit. Donations fund free career training, credentialing fees, and learner support services.

**[Donate via PayPal →](https://www.paypal.com/donate/?business=Marcusgreene0103%40gmail.com&currency_code=USD)**

---

**License:** Proprietary — All rights reserved by 2Exclusive LLC-S d/b/a Elevate for Humanity Career & Training Institute.
