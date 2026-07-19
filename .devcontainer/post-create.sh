#!/usr/bin/env bash
set -euo pipefail

echo "==> Enabling pnpm via corepack"
corepack enable
corepack prepare pnpm@latest --activate

echo "==> Installing PostgreSQL client tools"
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends postgresql-client
sudo rm -rf /var/lib/apt/lists/*

echo "==> Installing Supabase CLI"
if ! command -v supabase >/dev/null 2>&1; then
  ARCH="$(dpkg --print-architecture)"
  SUPABASE_VERSION="$(curl -fsSL https://api.github.com/repos/supabase/cli/releases/latest | grep -o '"tag_name": *"v[^"]*' | grep -o '[0-9][^"]*')"
  curl -fsSL "https://github.com/supabase/cli/releases/download/v${SUPABASE_VERSION}/supabase_linux_${ARCH}.tar.gz" -o /tmp/supabase.tar.gz
  sudo tar -xzf /tmp/supabase.tar.gz -C /usr/local/bin supabase
  rm -f /tmp/supabase.tar.gz
fi
supabase --version

echo "==> Installing project dependencies"
pnpm install

if [ ! -f .env.local ] && [ -f .env.example ]; then
  echo "==> Creating .env.local from .env.example"
  cp .env.example .env.local
fi

echo "✅ FoxyCare app dev container is ready. Run 'pnpm dev' to start Next.js."
