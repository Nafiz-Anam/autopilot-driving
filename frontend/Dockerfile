# ──────────────────────────────────────────────────────────────────────────────
# Stage 1: deps — install all node_modules
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm config set strict-dep-builds false --location project \
  && pnpm install --frozen-lockfile --shamefully-hoist --config.strict-dep-builds=false

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2: builder — Next.js standalone (UI-only, no DB client)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV SKIP_ENV_VALIDATION=1
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_APP_URL=http://localhost:3008
ARG NEXT_PUBLIC_BACKEND_API_BASE_URL=
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_BACKEND_API_BASE_URL=$NEXT_PUBLIC_BACKEND_API_BASE_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_dummy_build_time_only
RUN pnpm build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 3: runner — minimal production image
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN npm install -g pnpm@10.33.2
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3008
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3008

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3008/ || exit 1

CMD ["node", "server.js"]
