# Autopilot Driving School — Web Application

> **"Learn to Drive with Autopilot"** — UK's premier driving school platform

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript 5
- Tailwind CSS v4, shadcn/ui, Framer Motion v12
- Prisma ORM v7, PostgreSQL
- NextAuth.js v5 (Credentials)
- Stripe v22 (PaymentIntents + Webhooks)
- Nodemailer + React Email
- Zustand v5, React Hook Form v7, Zod v3

## Prerequisites
- Node.js >= 22
- pnpm >= 8
- PostgreSQL database

## Installation

### 1. Clone & install
```bash
cd frontend
pnpm install
```

### 2. Environment variables
```bash
cp .env.local.example .env.local
```
Fill in all values in `.env.local`. See [Environment Variables](#environment-variables) below.

### 3. Database setup
```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with test data
pnpm db:seed
```

### 4. Run development server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test Accounts (after seeding)
| Role | Email | Password |
|------|-------|----------|
| Student | student@test.com | password123 |
| Instructor | instructor@test.com | password123 |
| Admin | admin@test.com | password123 |

## Environment Variables

Create `.env.local` from the example file. Required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@localhost:5432/autopilot` |
| `NEXTAUTH_SECRET` | Random secret for NextAuth — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full URL of your app, e.g. `http://localhost:3000` |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL (used client-side) |

SMTP and email notification credentials are configured in the admin dashboard settings panel.

## Stripe Webhook (local dev)
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Copy the webhook signing secret and save it from the admin dashboard Stripe settings page.

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages & API routes
│   ├── (auth)/             # Sign-in / sign-up pages
│   ├── (marketing)/        # Public-facing pages (home, about, areas, prices...)
│   ├── student/            # Student dashboard & bookings
│   ├── instructor/         # Instructor dashboard
│   ├── admin/              # Admin panel
│   └── api/                # API route handlers (auth, bookings, payments...)
├── components/
│   ├── emails/             # React Email templates
│   ├── shared/             # Reusable UI sections (PageHero, CallbackForm...)
│   └── ui/                 # shadcn/ui primitives
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions, auth config, Prisma client, Stripe
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Database seed script
├── public/
│   └── fonts/              # Self-hosted web fonts (see public/fonts/README.txt)
├── store/                  # Zustand state stores
├── types/                  # Shared TypeScript types
└── env.ts                  # Type-safe env validation (@t3-oss/env-nextjs)
```

## Docker

All ports are offset **+8** from their defaults:

| Service | Container port | Host port |
|---------|---------------|-----------|
| Next.js app | 3008 | **3008** |
| PostgreSQL | 5432 | **5440** |
| pgAdmin (optional) | 80 | **5058** |

### Quick start with Docker Compose

```bash
# From the project root (e:/personal/autopilot-driving/)
cp .env.example .env          # create from example if present

# Start database + app
docker compose up -d

# Run migrations + seed (one-time)
docker compose --profile migrate up migrate

# Open app
open http://localhost:3008
```

### pgAdmin (optional GUI)
```bash
docker compose --profile tools up -d pgadmin
# Open http://localhost:5058
# Login: admin@autopilot.local / admin
```

### Build the app image manually
```bash
cd frontend
docker build -t autopilot-app .
docker run -p 3008:3008 --env-file .env.local autopilot-app
```

## Deployment
1. Set all environment variables on your hosting platform (Vercel, Railway, etc.)
2. Run `pnpm build` then `pnpm start`
3. Run database migrations: `pnpm db:migrate`
4. Configure Stripe webhook endpoint to `https://yourdomain.com/api/payments/webhook`
5. Save Stripe keys and webhook secret in the Admin Dashboard payment settings

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed database with test data |
| `pnpm db:studio` | Open Prisma Studio (database GUI) |
| `pnpm db:reset` | Reset database and re-seed |
