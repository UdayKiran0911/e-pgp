# EPG Platform

Enterprise Project Governance Platform — the operating system for project
delivery: standardized, auditable, compliant, and intelligent workflows.

**Standardize. Govern. Audit. Deliver.**

See [CLAUDE.md](CLAUDE.md) for the full development guide (repo layout,
commands, testing policy, UI standards, and the Ant Design + Next.js RSC
gotcha worth knowing before touching `apps/web`). See
[roadmap.md](roadmap.md) for what's built and what's next.

## Quick start

```bash
corepack enable
pnpm install
docker compose up -d postgres
pnpm --filter api exec prisma migrate deploy
pnpm dev
```

- Web: http://localhost:3000
- API: http://localhost:4000 (health check: http://localhost:4000/health)

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Ant Design 6
- **Backend**: NestJS + TypeScript + Prisma (PostgreSQL)
- **Monorepo**: pnpm workspaces + Turborepo
- **Testing**: Vitest + Testing Library + Playwright (web), Jest (api)
- **Deployment**: Docker + Docker Compose, CI via GitHub Actions
