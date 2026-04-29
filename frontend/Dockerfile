# ──────────────────────────────────────────────────────────────────────────────
# Stage 1: deps — install all node_modules
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --shamefully-hoist flattens node_modules (like npm) so Next.js standalone
# traces real files rather than pnpm symlinks into .pnpm virtual store
RUN pnpm install --frozen-lockfile --shamefully-hoist

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2: builder — generate Prisma client and build Next.js
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client — dummy URL avoids PrismaConfigEnvError at build time
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" pnpm db:generate

# Build — skip env validation and provide dummy values for SDK constructors
# that run at module level (e.g. Stripe). These are never used at runtime;
# real secrets are injected via docker-compose environment at startup.
ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://user:pass@localhost:5432/db
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=build-time-dummy-secret-32-chars-min
ENV GOOGLE_CLIENT_ID=dummy
ENV GOOGLE_CLIENT_SECRET=dummy
ENV STRIPE_SECRET_KEY=sk_test_dummy_build_time_only
ENV STRIPE_WEBHOOK_SECRET=whsec_dummy_build_time_only
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_dummy_build_time_only
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV SMTP_HOST=localhost
ENV SMTP_USER=dummy@example.com
ENV SMTP_PASS=dummy
ENV EMAIL_FROM=dummy@example.com
ENV EMAIL_ADMIN=dummy@example.com
RUN pnpm build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 3: runner — minimal production image
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3008
ENV HOSTNAME=0.0.0.0

# Add non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only what's needed for production
COPY --from=builder /app/public         ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static  ./.next/static
COPY --from=builder /app/prisma        ./prisma
# Prisma: generated client + full @prisma org (client, adapter-pg, etc.)
# Next.js standalone trace misses these because Prisma uses dynamic requires
COPY --from=builder /app/node_modules/.prisma       ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma       ./node_modules/@prisma

USER nextjs

EXPOSE 3008

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3008/ || exit 1

CMD ["node", "server.js"]
