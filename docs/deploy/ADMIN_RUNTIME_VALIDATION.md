# Admin Runtime Validation

Checklist for validating the admin ECS service after a deploy.

## Quick checks (< 2 min)

1. **Health endpoint** — `GET https://admin.elevateforhumanity.org/api/health` returns `200`
2. **Login** — sign in as `super_admin` and confirm dashboard loads
3. **Nav** — verify all top-level nav sections render without 500 errors
4. **AI Console** — send one message; confirm a provider responds
5. **Dev Studio** — open the terminal tab; confirm shell is responsive

## ECS service checks

```bash
aws ecs describe-services \
  --cluster elevate-cluster \
  --services elevate-admin-service \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount,deployments:deployments[*].{status:status,running:runningCount}}'
```

Expected: `status=ACTIVE`, `running == desired`, single `PRIMARY` deployment.

## Rollback

If the new task is unhealthy within 5 minutes:

```bash
./scripts/deploy-admin-ecs.sh --rollback
```

Or manually force the previous task definition:

```bash
aws ecs update-service \
  --cluster elevate-cluster \
  --service elevate-admin-service \
  --task-definition elevate-admin:<previous-revision>
```

## SSM parameter validation

Run before any deploy to catch missing secrets:

```bash
./scripts/setup-deploy-runtime.sh --check-only
```

## Known failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| 502 on all routes | Container OOM or crash loop | Check ECS task logs in CloudWatch |
| AI chat returns 500 | `OPENAI_API_KEY` missing or expired | Update SSM `/elevate/OPENAI_API_KEY` and redeploy |
| Dev Studio shell unresponsive | `GITHUB_TOKEN` missing | Update SSM `/elevate/GITHUB_TOKEN` |
| Login redirects to `/login` loop | `NEXTAUTH_SECRET` mismatch | Ensure SSM value matches what was baked into the image |
