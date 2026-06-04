# Dev Container — Elevate LMS

Standalone dev container for **VS Code Dev Containers** / GitHub Codespaces-style workflows.

**Not used by Cursor Cloud Agents.** Cloud agents follow `AGENTS.md` → “Cursor Cloud specific instructions” (nvm, placeholder `.env.local`, VM update script). Editing this folder in GitHub “Unified DevContainer” UI only affects container-based local dev.

---

## Quick start

### Prerequisites

- Docker Desktop (or any OCI-compatible runtime)
- VS Code with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Steps

1. Open the repo in VS Code → **F1** → **Dev Containers: Reopen in Container**

The container will:
- Install system packages (ffmpeg, chromium, python3)
- Install pnpm dependencies
- Copy `.env.example` to `.env.local` if no local env file exists

2. Fill any local-only secrets in `.env.local`.

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

Production and preview secrets are managed through Northflank runtime
environment variables and secret groups. Local dev uses `.env.local`.

`setup-env.sh` creates `.env.local` from `.env.example` when needed. It does not
pull production secrets into the dev container.

To refresh secrets manually at any time:

```bash
bash .devcontainer/setup-env.sh
# or
make env
```

### Missing secrets?

Fill in
values manually in `.env.local`, or add them to the appropriate Northflank
secret group for deployed services.

---

## Container lifecycle

| Hook | What it does |
|------|-------------|
| `onCreateCommand` | Installs system packages, pnpm deps, prepares `.env.local` |
| `postStartCommand` | Verifies `.env.local` exists |

Dev servers are **not started automatically** — run `make dev` after the container starts.

---

## Make targets

| Target | Description |
|--------|-------------|
| `make env` | Prepare `.env.local` from `.env.example` when missing |
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
| `setup-env.sh` | Creates `.env.local` from `.env.example` when missing |
