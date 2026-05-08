# Local Development Setup

## Prerequisites

- Node.js ≥ 20.11.1
- pnpm 10.x (`corepack enable && corepack prepare pnpm@10.28.2 --activate`)
- Access to the Supabase project (`cuxzzpsyufcewtmicszk`)

---

## 1. Clone and install

```bash
git clone https://github.com/elevateforhumanity/Elevate-lms.git
cd Elevate-lms
pnpm install
```

---

## 2. Configure environment

### Option A — Dev Container (recommended)

Open the repo in **GitHub Codespaces** or **VS Code Dev Containers**.  The
container runs `.devcontainer/setup-env.sh` automatically on every start,
which assembles `.env.local` from Codespaces secret chunks (if present) or
copies `.env.example` if `.env.local` doesn't exist yet.

For GitHub Codespaces add secrets under
**Settings → Secrets and variables → Codespaces**.  See
`.devcontainer/README.md` for the full list of required secrets.

### Option B — Manual

```bash
cp .env.example .env.local
```

Then fill in the required values (see section 3 below).

---

## 3. Required environment variables

These must be set or the app will refuse to start (`pnpm validate-env` exits non-zero):

| Variable                        | Where to find it                                                |
| ------------------------------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase Dashboard → Project Settings → API → Project URL       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon key          |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase Dashboard → Project Settings → API → service_role key  |
| `NEXT_PUBLIC_SITE_URL`          | Your deployment URL (e.g. `https://www.elevateforhumanity.org`) |

For migrations (`pnpm db:migrate`):

| Variable          | Where to find it                                                              |
| ----------------- | ----------------------------------------------------------------------------- |
| `SUPABASE_DB_URL` | Supabase Dashboard → Project Settings → Database → Connection string (pooler) |

All other variables are documented in `.env.example` with descriptions.

---

## 4. Start the dev server

```bash
pnpm dev
```

This runs `predev` (env assembly) then `next dev --turbopack` on port 3000.

If env assembly fails, the server will not start. Fix the missing vars before retrying.

---

## 5. Run migrations

Migrations are SQL files in `supabase/migrations/`. They are **not auto-applied**.

**Option A — Supabase Dashboard (always works):**

1. Open [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/sql/new)
2. Paste the migration SQL and click Run

**Option B — Migration script (requires `SUPABASE_DB_URL`):**

```bash
pnpm db:migrate
```

After applying a migration, verify with:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

---

## 6. Validate environment

```bash
pnpm validate-env
```

Exits 0 if all critical vars are set. Exits 1 with a clear list of what's missing.

---

## 7. Run tests

```bash
pnpm test          # unit tests (Vitest)
pnpm test:e2e      # E2E tests (Playwright) — requires running dev server
```

---

## 8. Build for production

```bash
pnpm build
```

Must complete with zero errors. Page count grows as features are added — do not hardcode it.

---

## Architecture notes

- **Program** = definition layer (outcomes, compliance, funding, CTAs) — `programs` table
- **Course** = execution layer (modules, lessons, quizzes, competencies) — `courses` + `course_modules` + `course_lessons`
- Programs link to courses via `program_course_links` table (DB-driven, no hardcoded map)
- New programs register via `POST /api/admin/course-builder/program-map`
- All content goes through validation (`lib/course-builder/validate.ts`) and compliance audit (`lib/course-builder/audit.ts`) before publish
- Publish requires `review_status = 'approved'` — submit via `POST /api/admin/programs/[id]/review`

See `AGENTS.md` for full coding conventions.
