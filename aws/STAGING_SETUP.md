# Staging Environment Setup

The `deploy-staging.yml` workflow is ready. It deploys to a separate ECS cluster
on every push to the `staging` branch. The following AWS resources must be
provisioned once before the workflow can run.

---

## AWS Resources to Create

### 1. ECS Cluster

```
Name: elevate-cluster-staging
Type: FARGATE
```

### 2. ECS Services

| Service name                    | Task definition          | Desired count |
|---------------------------------|--------------------------|---------------|
| `elevate-lms-staging-service`   | `elevate-lms-staging`    | 1             |
| `elevate-admin-staging-service` | `elevate-admin-staging`  | 1             |

Task definitions are in `aws/ecs-task-lms-staging.json` and `aws/ecs-task-admin-staging.json`.
Register them via:

```bash
aws ecs register-task-definition \
  --cli-input-json file://aws/ecs-task-lms-staging.json

aws ecs register-task-definition \
  --cli-input-json file://aws/ecs-task-admin-staging.json
```

### 3. ECR Repositories

```
elevate-lms-staging
elevate-admin-staging
```

### 4. CodeBuild Projects

Clone the existing `elevate-lms-build` and `elevate-admin-build` projects:

| New project name              | Buildspec                  | ECR repo               |
|-------------------------------|----------------------------|------------------------|
| `elevate-lms-staging-build`   | `aws/buildspec-lms.yml`    | `elevate-lms-staging`  |
| `elevate-admin-staging-build` | `aws/buildspec-admin.yml`  | `elevate-admin-staging`|

Set these environment variables on each CodeBuild project:
- `DEPLOY_ENV=staging`
- `ECS_CLUSTER=elevate-cluster-staging`

### 5. CloudWatch Log Groups

```
/ecs/elevate-lms-staging
/ecs/elevate-admin-staging
```

### 6. SSM Parameter Store

Mirror all `/elevate/*` parameters under `/elevate-staging/*` with staging-appropriate values.

Key parameters that must differ from production:

| Parameter                              | Staging value                              |
|----------------------------------------|--------------------------------------------|
| `/elevate-staging/NEXT_PUBLIC_SUPABASE_URL` | Staging Supabase project URL          |
| `/elevate-staging/SUPABASE_SERVICE_ROLE_KEY` | Staging service role key             |
| `/elevate-staging/STRIPE_SECRET_KEY`   | Stripe test mode key (`sk_test_...`)       |
| `/elevate-staging/SENDGRID_API_KEY`    | SendGrid key (can reuse prod)              |
| `/elevate-staging/CRON_SECRET`         | Different from prod                        |
| `/elevate-staging/NEXT_PUBLIC_APP_URL` | `https://staging.elevateforhumanity.org`   |

### 7. GitHub Secrets

Add to the repository secrets:

| Secret               | Value                                          |
|----------------------|------------------------------------------------|
| `STAGING_URL`        | `https://staging.elevateforhumanity.org`       |
| `STAGING_ADMIN_URL`  | `https://staging-admin.elevateforhumanity.org` |
| `STAGING_CRON_SECRET`| A separate secret for staging cron auth        |

---

## Branch Protection

Add a branch protection rule for `main`:
- Require the `staging` branch to pass CI before merging to `main`
- Require at least 1 approving review
- Require status checks: `deploy-lms-staging`, `deploy-admin-staging`

This enforces the flow: `feature branch → staging → main → production`

---

## Supabase Staging Project

Create a separate Supabase project for staging:
1. New project in the same org
2. Run all migrations from `supabase/migrations/` against it
3. Seed with test data (not production data)
4. Add its URL and service role key to SSM under `/elevate-staging/`

---

## DNS

| Subdomain                                  | Points to                        |
|--------------------------------------------|----------------------------------|
| `staging.elevateforhumanity.org`           | Staging LMS ALB                  |
| `staging-admin.elevateforhumanity.org`     | Staging Admin ALB                |
