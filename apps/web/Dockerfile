# Build from the monorepo root: docker build -f apps/web/Dockerfile .
FROM node:20-alpine AS base
RUN corepack enable

# --- Prune the monorepo down to what apps/web actually needs ---
FROM base AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY . .
RUN npx turbo prune web --docker

# --- Install dependencies for the pruned workspace ---
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=web

# --- Runtime ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]
