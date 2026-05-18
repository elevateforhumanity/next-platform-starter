#!/usr/bin/env bash
# .devcontainer/setup-env.sh
#
# Lightweight environment bootstrap — runs on postCreateCommand and
# postStartCommand.  It only assembles .env.local; it does NOT install
# dependencies, generate media, or start the dev server.
#
# Usage:
#   bash .devcontainer/setup-env.sh   (called automatically by devcontainer.json)
#
# To start the dev server after the container is ready:
#   pnpm dev              # LMS  (port 3000)
#   cd apps/admin && pnpm dev   # Admin (port 3001)

set -e
cd "$(dirname "$0")/.."

echo "▶ Setting up environment..."

# Pull secrets from AWS SSM Parameter Store if credentials are available.
# All secrets live at /elevate/* in account 954718262498 (us-east-1).
# Set ELEVATE_AWS_ACCESS_KEY_ID and ELEVATE_AWS_SECRET_ACCESS_KEY as Gitpod
# project secrets to enable this path.
if [ -n "${ELEVATE_AWS_ACCESS_KEY_ID:-}" ] && [ -n "${ELEVATE_AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo "  Pulling secrets from AWS SSM..."
  AWS_ACCESS_KEY_ID="$ELEVATE_AWS_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$ELEVATE_AWS_SECRET_ACCESS_KEY" \
  AWS_DEFAULT_REGION="us-east-1" \
  python3 - << 'PYEOF'
import subprocess, json, os, sys

result = subprocess.run([
  "aws", "ssm", "get-parameters-by-path",
  "--path", "/elevate/",
  "--with-decryption",
  "--region", "us-east-1",
  "--query", "Parameters[*].{Name:Name,Value:Value}",
  "--output", "json"
], capture_output=True, text=True,
   env={**os.environ,
        "AWS_ACCESS_KEY_ID": os.environ["ELEVATE_AWS_ACCESS_KEY_ID"],
        "AWS_SECRET_ACCESS_KEY": os.environ["ELEVATE_AWS_SECRET_ACCESS_KEY"],
        "AWS_DEFAULT_REGION": "us-east-1"})

if result.returncode != 0:
  print(f"  SSM pull failed: {result.stderr.strip()}", file=sys.stderr)
  sys.exit(0)

params = json.loads(result.stdout)
lines = []
for p in params:
  key = p["Name"].replace("/elevate/", "")
  val = p["Value"].replace("\n", "\\n")
  lines.append(f"{key}={val}")

with open(".env.local", "w") as f:
  f.write("\n".join(lines) + "\n")

print(f"  Wrote {len(lines)} secrets from SSM to .env.local")
PYEOF
  SSM_EXIT=$?
  if [ $SSM_EXIT -eq 0 ]; then
    echo "  SSM pull complete"
    # Skip chunk assembly — SSM is the source of truth
    SSM_DONE=1
  fi
fi

# Assemble .env.local from Codespaces secret chunks if SSM didn't already run.
# Secret chunks are set as Codespaces repository secrets named ENV_LOCAL_1,
# ENV_LOCAL_2, ENV_LOCAL_3 — they are written to .env_local_N.txt by the
# Codespaces secrets injection mechanism.
if [ -z "${SSM_DONE:-}" ]; then
  if [ -f .env_local_1.txt ] && [ -f .env_local_2.txt ] && [ -f .env_local_3.txt ]; then
    cat .env_local_1.txt .env_local_2.txt .env_local_3.txt > .env.local
    echo "  Assembled .env.local from secret chunks"
  elif [ ! -f .env.local ] && [ -f .env.example ]; then
    cp .env.example .env.local
    echo "  Created .env.local from .env.example — fill in your Supabase keys before running"
  elif [ -f .env.local ]; then
    echo "  .env.local already exists — skipping"
  else
    echo "  No .env.example found — create .env.local manually before starting the dev server"
  fi
fi

# Merge ALL live shell env vars into .env.local.
# Gitpod injects secrets directly into the container environment. The chunk
# files are a template with blank values — the real values are in printenv.
# This loop fills in every blank or missing key in .env.local from the shell.
if [ -f .env.local ]; then
  MERGED=0
  # Read only the key names from printenv, then fetch each value via bash
  # indirect expansion ${!VAR} to avoid splitting on '=' inside base64/JWT values.
  for VAR in $(printenv | grep -oE '^[A-Z][A-Z0-9_]+' | sort -u); do
    VAL="$(bash -c "echo \"\${$VAR}\"")"
    [ -z "$VAL" ] && continue
    if grep -qE "^${VAR}=.+" .env.local 2>/dev/null; then
      : # already has a value — leave it
    elif grep -q "^${VAR}=" .env.local 2>/dev/null; then
      # key exists but blank — fill it in from shell
      sed -i "s|^${VAR}=.*|${VAR}=${VAL}|" .env.local
      MERGED=$((MERGED + 1))
    fi
    # Don't append vars not already in the template — avoids polluting .env.local
    # with unrelated shell vars (PATH, HOME, TERM, etc.)
  done
  [ "$MERGED" -gt 0 ] && echo "  Merged $MERGED env vars from shell into .env.local"
fi

echo "  Environment setup complete"

# Export NEXT_PUBLIC_* and other critical vars into the shell profile so that
# dev services started by Gitpod automations inherit them. This is necessary
# because devcontainer.json injects ${localEnv:VAR} as empty strings when the
# vars are not set as Gitpod secrets — empty shell env vars take precedence
# over .env.local in Next.js, causing "Supabase not configured" at runtime.
if [ -f .env.local ]; then
  PROFILE_EXPORT="$HOME/.bashrc"
  # Remove any previous block written by this script
  sed -i '/# >>> elevate-env >>>/,/# <<< elevate-env <<</d' "$PROFILE_EXPORT" 2>/dev/null || true
  {
    echo "# >>> elevate-env >>>"
    # Export all non-empty, non-comment vars from .env.local so that dev
    # services (Next.js, scripts) inherit them regardless of how the container
    # was started. Empty string exports are skipped — they would shadow secrets
    # injected by Gitpod/Codespaces and cause "not configured" errors at runtime.
    grep -E "^[A-Z_]+=.+" .env.local \
      | grep -v "^#" \
      | sed 's/^/export /'
    echo "# <<< elevate-env <<<"
  } >> "$PROFILE_EXPORT"
  echo "  Exported env vars to $PROFILE_EXPORT"
fi

echo ""
echo "  To start the dev server:"
echo "    pnpm dev                      # LMS app   → http://localhost:3000"
echo "    cd apps/admin && pnpm dev     # Admin app → http://localhost:3001"
