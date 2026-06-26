#!/bin/sh
set -e

echo "[startup] Generating Prisma client..."
pnpm prisma generate

# Baseline any migration not yet recorded in _prisma_migrations.
# migrate resolve --applied is idempotent-safe: it only fails if the migration
# is already marked (P3008), which we suppress. This handles first-time deploys
# on DBs previously managed with db push or raw SQL.
echo "[startup] Baselining migrations (skips any already applied)..."
for dir in prisma/migrations/*/; do
  name=$(basename "$dir")
  if [ -f "${dir}migration.sql" ]; then
    pnpm prisma migrate resolve --applied "$name" 2>&1 | grep -v "P3008\|already recorded" || true
  fi
done

echo "[startup] Applying any pending migrations..."
pnpm prisma migrate deploy

echo "[startup] Starting application..."
exec pnpm exec pm2-runtime start ecosystem.config.json
