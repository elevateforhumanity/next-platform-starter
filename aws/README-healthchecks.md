# ECS health checks (LMS)

<<<<<<< HEAD
Container health uses **readiness first**, then liveness:

```bash
curl -sf http://localhost:3000/api/ready && curl -sf http://localhost:3000/api/health
```

- `/api/ready` — **503** when critical env or DB is unavailable (readiness probe).
- `/api/health` — **500** only on hard failures (missing env, disabled audit triggers).

`startPeriod` is **90s** to allow Next.js cold start before ECS marks the task unhealthy.

Task definitions: `aws/ecs-task-lms.json`, `aws/ecs-task-lms-staging.json`.

After changing task definitions, register a new revision and update the ECS service (deploy workflow does this via CodeBuild).
=======
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
>>>>>>> origin/cursor/platform-e2e-audit-c4c6
