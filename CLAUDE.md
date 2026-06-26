# Project Rules

## Database migrations — NEVER use raw SQL directly on live DB

All schema changes (tables, columns, enums, indexes) MUST go through Prisma migrations:

```bash
# 1. Edit backend/prisma/schema.prisma
# 2. Generate the migration file
cd backend && pnpm prisma migrate dev --name describe_the_change
# 3. Commit the generated migration file
# 4. Push — CI runs `prisma migrate deploy` on startup
```

**Never run raw SQL on the live DB to add/modify schema objects.**
Reasons:
- `prisma migrate deploy` (used in production Dockerfile) only applies numbered migration files
- Manual SQL causes schema drift — Prisma sees DB state doesn't match schema.prisma and can crash or try to remove live data
- Migration files are version-controlled and reproducible across environments

**If schema drift already happened** (emergency only):
1. Add the missing definitions to `schema.prisma`
2. Create a migration file that matches what was manually applied
3. Mark it as applied: `prisma migrate resolve --applied <migration_name>`

## Stack
- Backend: Node.js + Express + Prisma + PostgreSQL (Docker)
- Frontend: Next.js (app router) — see `frontend/AGENTS.md`
- Deploy: push to `main` → GitHub Actions builds images → deploys to VPS at `driving` SSH host
- Live DB: `autopilot_prod` on `autopilot_prod_db` Docker container
