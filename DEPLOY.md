# Deploy Elevate LMS

**Elevate for Humanity production** runs on **Northflank** only (`elevate-lms` + `elevate-admin`). There is no AWS ECS or Netlify production deploy path in this repository.

Canonical runbooks:

- `docs/deploy/northflank-separate-lms-admin.md`
- `docs/audits/aws-ecs-decommission-2026-06.md` (legacy teardown checklist)
- `pnpm tsx scripts/northflank/verify-health-checks.ts`

## Production (Northflank)

| Service | Dockerfile | CI workflow | Health |
|---------|------------|---------------|--------|
| LMS (`elevate-lms`) | `Dockerfile.northflank-lms` | `.github/workflows/deploy-lms.yml` | `GET /api/ping`, `GET /api/ready` |
| Admin (`elevate-admin`) | `Dockerfile.northflank-admin` | `.github/workflows/deploy-admin.yml` | `GET /api/ping`, `GET /api/health` |

Merge to `main` triggers deploy when paths under `lib/`, `components/`, `apps/admin/`, or Dockerfiles change. Manual deploy:

```bash
DEPLOY_BRANCH=main pnpm tsx scripts/northflank/deploy-live.ts --execute
```

Secrets: Northflank secret group `elevate-production-env` on project `elevate-platform`.

---

## Licensed self-hosted deployment

For organizations running their own instance:

1. **Purchase a license** at [elevateforhumanity.org/store](https://www.elevateforhumanity.org/store)
2. **Get private repo access** after purchase
3. **Build** with `Dockerfile.northflank-lms` and/or `Dockerfile.northflank-admin`
4. **Configure** Supabase + env vars (see below)

---

## Managed white-label (we host)

- Your branding on our Northflank infrastructure
- Custom subdomain or your own domain
- We manage updates, security, and scaling

[Request a demo →](https://www.elevateforhumanity.org/store/trial)

---

## Environment variables required

```bash
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Stripe (Payments)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Northflank deploy (CI only)
NORTHFLANK_API_TOKEN=
```

## Quick start after deploy

1. Set up Supabase project at [supabase.com](https://supabase.com)
2. Run database migrations (see `/supabase/migrations`)
3. Configure Stripe webhooks pointing to `https://www.elevateforhumanity.org/api/webhooks/stripe`
4. Smoke: `curl -sf https://www.elevateforhumanity.org/api/ready`

## Support

- **Documentation**: [/docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/elevate-for-humanity/Elevate-lms/issues)
- **Email**: support@elevateforhumanity.org
