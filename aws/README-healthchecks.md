# ECS health checks (LMS)

Container health uses readiness first, then liveness in `ecs-task-lms.json` and `ecs-task-lms-staging.json`:

```bash
curl -sf http://localhost:3000/api/ready >/dev/null && \
curl -sf http://localhost:3000/api/health >/dev/null || exit 1
```

| Path | Purpose |
|------|---------|
| `/api/ready` | Readiness: 503 if critical env or DB is unavailable |
| `/api/health` | Liveness and dependency diagnostics; 500 only on hard failures |

`startPeriod`: **90s** for Next.js cold start.

**ALB:** Prefer target group health check on `/api/ready` (matcher 200).

After changing task definitions, register a new revision and update the ECS service. The deploy workflow does this via CodeBuild.
