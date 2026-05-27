# Deployment Stabilization Window

Defines the expected timeline and monitoring protocol after each production deploy.

## Timeline

| Time after deploy | Action |
|---|---|
| 0–2 min | ECS pulls new image, starts new task |
| 2–4 min | ALB health checks pass, new task registered |
| 4–6 min | Old task drains and stops |
| 6–10 min | **Stabilization window** — monitor for errors |
| 10 min | Deploy considered stable if no rollback triggered |

## Monitoring during stabilization

**ECS deployment status:**
```bash
watch -n 10 "aws ecs describe-services \
  --cluster elevate-cluster \
  --services elevate-lms-service elevate-admin-service \
  --query 'services[*].{name:serviceName,running:runningCount,deployments:length(deployments)}'"
```

**CloudWatch logs (last 50 lines):**
```bash
aws logs tail /ecs/elevate-lms --follow --since 10m
aws logs tail /ecs/elevate-admin --follow --since 10m
```

## Automatic rollback triggers

ECS will automatically roll back if:
- New task fails health checks 3 times within the `healthCheckGracePeriodSeconds` window
- Container exits with non-zero code on startup

## Manual rollback

```bash
# Admin
./scripts/deploy-admin-ecs.sh --rollback

# LMS — force previous task definition
aws ecs update-service \
  --cluster elevate-cluster \
  --service elevate-lms-service \
  --task-definition elevate-lms:<previous-revision> \
  --force-new-deployment
```

## Post-stabilization

After the 10-minute window with no errors:
1. Verify key user flows (login, apply, payment, LMS lesson)
2. Check Stripe webhook delivery in the Stripe dashboard
3. Confirm SendGrid activity for any triggered emails
4. Update `docs/deploy/` with deploy date and image tag
