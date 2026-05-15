# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --config.strict-dep-builds=false

# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" pnpm dlx prisma generate
RUN pnpm build

# ── Stage 3: runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl
RUN npm install -g pnpm@10.33.2
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8008

RUN addgroup --system --gid 1001 nodejs && \
  adduser  --system --uid 1001 nodejs

COPY --from=builder --chown=nodejs:nodejs /app/build             ./build
COPY --from=builder --chown=nodejs:nodejs /app/node_modules      ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json      ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma            ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/prisma.config.ts  ./prisma.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/ecosystem.config.json ./ecosystem.config.json
COPY --from=builder --chown=nodejs:nodejs /app/scripts           ./scripts

# Pre-create writable directories the app creates at runtime
RUN mkdir -p uploads logs && chown -R nodejs:nodejs uploads logs

USER nodejs

EXPOSE 8008

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:8008/v1/health/live || exit 1

# Run Prisma generate + schema sync + demo seed at startup, then launch API.
# Use local Prisma CLI (not dlx) to avoid runtime package download delays.
CMD ["sh", "-c", "pnpm prisma generate && pnpm prisma db push --accept-data-loss && pnpm run db:seed && pnpm exec pm2-runtime start ecosystem.config.json"]
