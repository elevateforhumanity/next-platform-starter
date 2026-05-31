# ECS health checks (LMS)

Container health in `ecs-task-lms.json` and `ecs-task-lms-staging.json`:

```bash
curl -sf http://localhost:3000/api/ready >/dev/null && \
curl -sf http://localhost:3000/api/health >/dev/null || exit 1
```

| Path | Purpose |
|------|---------|
| `/api/ready` | Readiness — 503 if env or DB unavailable |
| `/api/health` | Liveness + dependency diagnostics |

`startPeriod`: **90s** for Next.js cold start.

**ALB:** Prefer target group health check on `/api/ready` (matcher 200).
