# Dev Container — Elevate LMS

This repository ships a single canonical Dev Container configuration at
`.devcontainer/devcontainer.json`.  It works with **GitHub Codespaces** and
any **VS Code Dev Containers** host (Docker Desktop, Rancher Desktop, etc.).

---

## Quick start

### GitHub Codespaces

1. Open the repo on GitHub → **Code** → **Codespaces** → **New codespace**
2. The container builds automatically (`onCreateCommand` → `postCreateCommand`)
3. Add secrets in **Settings → Secrets and variables → Codespaces** (see table below)
4. Open a terminal and run the dev server:

```bash
pnpm dev                    # LMS app   → http://localhost:3000
cd apps/admin && pnpm dev   # Admin app → http://localhost:3001
```

### VS Code Dev Containers (local Docker)

1. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Open the repo folder in VS Code
3. Press **F1** → **Dev Containers: Reopen in Container**
4. Copy `.env.example` → `.env.local` and fill in your Supabase keys
5. Run `pnpm dev`

---

## What the container provides

| Feature | Detail |
|---------|--------|
| Base image | `mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm` (Node 20 LTS) |
| Package manager | pnpm 10.28.2 (activated via corepack) |
| System packages | ffmpeg, chromium, python3, libxml2-utils |
| Forwarded ports | `3000` (LMS), `3001` (admin app) |
| Build cache | `.next/cache` persisted in a named Docker volume |
| VS Code extensions | ESLint, Prettier, Tailwind CSS IntelliSense, TypeScript, GitLens, GitHub Copilot, YAML, SQL Tools, Docker |

---

## Container lifecycle

| Hook | What it does |
|------|-------------|
| `onCreateCommand` | Installs system packages (runs once on first build) |
| `postCreateCommand` | Activates pnpm, runs `pnpm install`, bootstraps `.env.local` (runs once after workspace creation) |
| `postStartCommand` | Re-assembles `.env.local` from Codespaces secret chunks if present (runs on every start — lightweight) |

The dev server is **not started automatically**.  Run `pnpm dev` in the
terminal after the container starts.

---

## Required Codespaces secrets

Set these as repository-level Codespaces secrets
(**Settings → Secrets and variables → Codespaces**):

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `NEXTAUTH_SECRET` | Random 32-byte hex (`openssl rand -hex 32`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (use test key for dev) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `OPENAI_API_KEY` | Optional — AI/TTS features |
| `SENDGRID_API_KEY` | Optional — email features |

### Optional: secret chunks

If you store `.env.local` split across three Codespaces secrets
(`ENV_LOCAL_1`, `ENV_LOCAL_2`, `ENV_LOCAL_3`), the container writes the
files as `.env_local_1.txt`, `.env_local_2.txt`, `.env_local_3.txt` and the
`setup-env.sh` script reassembles them into `.env.local` automatically on
every start.

All other variables are documented in `.env.example`.

---

## Manual setup (no container)

```bash
node -v           # requires Node ≥ 20.11.1
corepack enable
corepack prepare pnpm@10.28.2 --activate
pnpm install
cp .env.example .env.local   # fill in Supabase keys
pnpm dev                     # starts on port 3000
```

---

## Files in this directory

| File | Purpose |
|------|---------|
| `devcontainer.json` | Single canonical Dev Container configuration |
| `setup-env.sh` | Lightweight env bootstrap (called by lifecycle hooks) |
