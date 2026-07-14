# Build from the monorepo root: docker build -f apps/api/Dockerfile .
FROM node:20-alpine AS base
RUN corepack enable

# --- Prune the monorepo down to what apps/api actually needs ---
FROM base AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY . .
RUN npx turbo prune api --docker

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
RUN pnpm --filter api exec prisma generate
RUN pnpm turbo run build --filter=api

# --- Runtime ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=builder --chown=nestjs:nodejs /app .

EXPOSE 4000
ENV PORT=4000
CMD ["node", "apps/api/dist/main.js"]
