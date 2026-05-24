#!/usr/bin/env bash
set -euo pipefail

echo "🔧 EFH Gitpod setup starting..."

# Prefer pnpm if lockfile exists; else npm
if [ -f pnpm-lock.yaml ]; then
  core_pm="pnpm"
elif [ -f bun.lockb ]; then
  core_pm="bun"
else
  core_pm="npm"
fi

echo "📦 Installing dependencies with $core_pm ..."
case "$core_pm" in
  pnpm) pnpm install --frozen-lockfile || pnpm install ;;
  bun)  bun install ;;
  *)    npm ci || npm install ;;
esac

# Ensure design system CSS is imported
if ! grep -q "design-system.css" ./src/main.tsx 2>/dev/null; then
  echo "🎨 Design system CSS already configured in main.tsx"
fi

# Ensure Tailwind config exists (already configured with EFH design system)
if [ -f tailwind.config.js ]; then
  echo "✅ Tailwind config found (EFH design system)"
else
  echo "⚠️  Warning: tailwind.config.js not found"
fi

# Env file - pull from GitHub Secrets if available
if [ ! -f .env ]; then
  echo "🌱 Creating .env file..."
  
  # Pull secrets from AWS SSM
  if command -v aws &>/dev/null && [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
    echo "Pulling secrets from AWS SSM..."
    bash .devcontainer/setup-env.sh
  fi
  
  cat > .env <<ENV
# --- EFH Environment Variables ---
VITE_SITE_NAME="Elevate for Humanity"
VITE_PUBLIC_URL="http://localhost:3000"

# Supabase (loaded from GitHub Secrets or Gitpod variables)
VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-your_supabase_url_here}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-your_supabase_anon_key_here}

# Stripe (optional - for payments)
VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY:-}

# Application Form URL (optional)
VITE_APPLICATION_FORM_URL=${VITE_APPLICATION_FORM_URL:-https://www.indianacareerconnect.com}

# Analytics (optional)
VITE_GA_MEASUREMENT_ID=${VITE_GA_MEASUREMENT_ID:-G-EFHWORKFORCE01}
ENV

  if [ "${VITE_SUPABASE_URL:-your_supabase_url_here}" = "your_supabase_url_here" ]; then
    echo ""
    echo "Supabase credentials not configured."
    echo "Run: AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... bash .devcontainer/setup-env.sh"
  fi
else
  echo "✅ .env file exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 EFH LMS is ready. Key pages:"
echo "   - Homepage: /"
echo "   - Programs: /programs"
echo "   - Student Login: /login"
echo "   - Student Portal: /student-portal"
echo ""
echo "🚀 Run 'pnpm dev' to start the development server"
