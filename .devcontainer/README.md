# Dev Container — Elevate LMS

Standalone dev container. No dependency on Gitpod, Ona, Codespaces, or any CI platform.

**Cursor Cloud Agents** run on `/workspace` and do **not** use this devcontainer automatically — they use the VM update script + `AGENTS.md` Cloud instructions instead. Use this devcontainer for **VS Code / Dev Containers: Reopen in Container** only.

---

## Quick start

### Prerequisites

- Docker Desktop (or any OCI-compatible runtime)
- VS Code with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- AWS credentials with read access to SSM Parameter Store (`/elevate/*`)

### Steps

1. Set your AWS credentials in your shell:

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=us-east-1   # default if omitted
```

2. Open the repo in VS Code → **F1** → **Dev Containers: Reopen in Container**

The container will:
- Install system packages (ffmpeg, chromium, python3)
- Install pnpm dependencies
- Pull all secrets from AWS SSM into `.env.local`

3. Start the dev server:

```bash
pnpm dev          # LMS   -> http://localhost:3000
pnpm dev:admin    # Admin -> http://localhost:3001
```

Or use Make:

```bash
make dev
make dev-admin
```

---

## Secrets

All secrets live in AWS SSM Parameter Store under `/elevate/*`. The ECS task
definitions (`aws/ecs-task-lms.json`, `aws/ecs-task-admin.json`) are the
canonical list of what parameters exist.

`setup-env.sh` fetches every parameter under `/elevate/` and writes them to
`.env.local`. It runs automatically on container create and on every start so
rotated keys stay current without a rebuild.

To refresh secrets manually at any time:

```bash
bash .devcontainer/setup-env.sh
# or
make env
```

### Required IAM permissions

```json
{
  "Effect": "Allow",
  "Action": ["ssm:GetParametersByPath", "ssm:GetParameter"],
  "Resource": "arn:aws:ssm:us-east-1:954718262498:parameter/elevate/*"
}
```

### No AWS credentials?

`setup-env.sh` falls back to copying `.env.example` to `.env.local`. Fill in
values manually, or obtain AWS credentials and re-run `make env`.

---

## Container lifecycle

| Hook | What it does |
|------|-------------|
| `onCreateCommand` | Installs system packages, pnpm deps, pulls secrets from SSM |
| `postStartCommand` | Re-pulls secrets from SSM on every start |

Dev servers are **not started automatically** — run `make dev` after the container starts.

---

## Make targets

| Target | Description |
|--------|-------------|
| `make env` | Pull secrets from AWS SSM into `.env.local` |
| `make install` | Install pnpm dependencies |
| `make dev` | Start LMS dev server (port 3000) |
| `make dev-admin` | Start Admin dev server (port 3001) |
| `make build` | Production build |
| `make lint` | Run ESLint |
| `make setup` | Full first-time setup (env + install) |

---

## Files

| File | Purpose |
|------|---------|
| `devcontainer.json` | Container definition — image, features, lifecycle hooks |
| `setup-env.sh` | Pulls secrets from AWS SSM, writes `.env.local` |
