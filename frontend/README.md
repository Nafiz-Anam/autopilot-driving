# AutoPilot Driving School — Web Application

> **"Learn to Drive with Autopilot"** — UK's premier driving school platform

## Tech Stack
- Next.js 16 (App Router), React 19, TypeScript 5
- Tailwind CSS v4, shadcn/ui, Framer Motion v12
- Prisma ORM v7, PostgreSQL
- NextAuth.js v5 (Credentials + Google)
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

### 4. Add fonts
Place font files in `public/fonts/`:
- `Moderniz.woff2`
- `Metropolis-Regular.woff2`
- `Metropolis-Medium.woff2`
- `Metropolis-Bold.woff2`

Fallback fonts (DM Sans, Barlow) load from Google Fonts automatically.

### 5. Run development server
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
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` for dev) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (usually 587 or 465) |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASS` | SMTP password |
| `EMAIL_FROM` | From address for outgoing emails |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL (used client-side) |

## Stripe Webhook (local dev)
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Copy the webhook signing secret printed by the CLI and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

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
5. Add the Stripe webhook signing secret to your production environment as `STRIPE_WEBHOOK_SECRET`

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
