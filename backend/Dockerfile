# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" pnpm dlx prisma generate
RUN pnpm build

# ── Stage 3: runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nodejs

COPY --from=builder --chown=nodejs:nodejs /app/build             ./build
COPY --from=builder --chown=nodejs:nodejs /app/node_modules      ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json      ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma            ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/ecosystem.config.json ./ecosystem.config.json

# Pre-create writable directories the app creates at runtime
RUN mkdir -p uploads logs && chown -R nodejs:nodejs uploads logs

USER nodejs

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8000/v1/health/live || exit 1

# pm2-runtime keeps the process in the foreground (Docker-safe PM2)
CMD ["node_modules/.bin/pm2-runtime", "start", "ecosystem.config.json"]
