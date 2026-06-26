#!/bin/sh
set -e

echo "[startup] Generating Prisma client..."
pnpm prisma generate

# If _prisma_migrations table doesn't exist, this is a first-time deploy on an
# existing DB (previously managed with db push or raw SQL). Baseline all
# migrations so migrate deploy doesn't re-apply already-applied DDL.
STATUS=$(pnpm prisma migrate status 2>&1 || true)

if echo "$STATUS" | grep -q "_prisma_migrations.*does not exist\|No migration found in prisma/migrations\|P3005"; then
  echo "[startup] No migration history found — baselining all existing migrations..."
  for dir in prisma/migrations/*/; do
    name=$(basename "$dir")
    if [ -f "${dir}migration.sql" ]; then
      echo "[startup]   Marking $name as applied"
      pnpm prisma migrate resolve --applied "$name"
    fi
  done
  echo "[startup] Baseline complete."
fi

echo "[startup] Applying any pending migrations..."
pnpm prisma migrate deploy

echo "[startup] Starting application..."
exec pnpm exec pm2-runtime start ecosystem.config.json
