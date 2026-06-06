# Elevate OS — Seven Wires

The platform is ~58% built but ~12% wired end-to-end. These seven connections turn existing subsystems into a sellable AI business operating system.

## 1. Workspace provisioning

**Canonical path:** `POST /api/onboarding/launch` or `POST /api/workspaces/create`

- `lib/workspace/start-workspace-trial.ts` — tenant + org + workspace + trial license
- `lib/tenant/provision-trial-website.ts` — public site + subdomain
- `proxy.ts` + `lib/tenant/middleware-tenant-routing.ts` — `{slug}.app.elevateforhumanity.org` → `/tenant-site`

**Customer entry:** `/launch`

## 2. Unified trial system

**Canonical:** `startWorkspaceTrial()` via `lib/trial/unified-platform-trial.ts`

| Legacy | Status |
|--------|--------|
| `POST /api/trial/start-managed` | Delegates to `startWorkspaceTrial` |
| `POST /api/workspaces/create` | Same |
| Per-app trials (`lib/trial/start-app-trial.ts`) | Separate SKUs only |

## 3. AI intake

`POST /api/onboarding/launch` — business description → AI homepage copy + optional LMS seed course.

## 4. AI Team marketplace

`lib/ai/ai-team-catalog.ts` + `/store/ai-team` — productized agents (marketing, sales, enrollment, etc.).

## 5. Customer AI Operator

`/operator` + `POST /api/operator/chat` — customer-facing operator (not Dev Studio).

## 6. Autopilot

`lib/autopilot/platform-autopilot.ts` + `GET /api/cron/autopilot-tick` (daily via Cron Scheduler).

## 7. Customer onboarding

`/launch` → public site → dashboard → `/store/plans` checkout (`lib/store/launch-plans.ts`).

## Admin console

`/admin/platform` — workspace/trial/job counts + links to tenants, billing, health.

## Migration

Apply `supabase/migrations/20260709000001_workspace_provisioning_foundation.sql` in Supabase Dashboard before provisioning APIs work in production.
