# ECS health checks (LMS)

Container health uses **readiness first**, then liveness:

```bash
curl -sf http://localhost:3000/api/ready && curl -sf http://localhost:3000/api/health
```

- `/api/ready` — **503** when critical env or DB is unavailable (readiness probe).
- `/api/health` — **500** only on hard failures (missing env, disabled audit triggers).

`startPeriod` is **90s** to allow Next.js cold start before ECS marks the task unhealthy.

Task definitions: `aws/ecs-task-lms.json`, `aws/ecs-task-lms-staging.json`.

After changing task definitions, register a new revision and update the ECS service (deploy workflow does this via CodeBuild).
