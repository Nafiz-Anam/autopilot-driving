#!/bin/sh
set -e

echo "[startup] Generating Prisma client..."
pnpm prisma generate

# On first-ever deploy the _prisma_migrations table won't exist yet.
# Baseline every existing migration so migrate deploy doesn't try to re-run
# SQL that was already applied via db push or raw SQL.
# On subsequent deploys the table already exists — skip baselining so that
# newly added migrations are actually executed by migrate deploy.
MIGRATIONS_TABLE_EXISTS=$(pnpm prisma db execute --stdin --json 2>/dev/null <<'SQL'
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = '_prisma_migrations'
) AS exists;
SQL
) || true

if echo "$MIGRATIONS_TABLE_EXISTS" | grep -q '"exists":false\|"exists": false'; then
  echo "[startup] First deploy — baselining all existing migrations..."
  for dir in prisma/migrations/*/; do
    name=$(basename "$dir")
    if [ -f "${dir}migration.sql" ]; then
      pnpm prisma migrate resolve --applied "$name" 2>&1 | grep -v "P3008\|already recorded" || true
    fi
  done
else
  echo "[startup] Existing deployment — skipping baseline, running migrate deploy..."
fi

echo "[startup] Applying any pending migrations..."
pnpm prisma migrate deploy

echo "[startup] Starting application..."
exec pnpm exec pm2-runtime start ecosystem.config.json
