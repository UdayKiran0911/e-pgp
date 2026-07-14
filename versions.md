# EPG Platform — Versions

Semantic Versioning (`MAJOR.MINOR.PATCH`) per deployable app. Bumped by the
`release-cut` skill, which also appends the matching entry to
[changelog.md](changelog.md).

- **MAJOR** — breaking API/schema change, or a breaking change to the
  design token contract that requires downstream updates.
- **MINOR** — new module/feature, backwards compatible.
- **PATCH** — bug fix, no behavior change to any public contract.

## apps/web

| Version | Date | Notes |
|---|---|---|
| 0.1.0 | 2026-07-13 | Initial scaffold: Next.js 16 App Router + Ant Design 6, design tokens wired in, homepage placeholder. |

## apps/api

| Version | Date | Notes |
|---|---|---|
| 0.0.1 | 2026-07-13 | Initial scaffold: NestJS + Prisma (PostgreSQL via `@prisma/adapter-pg`), health check, base schema (Organization/User/Project/AuditLog). |

## packages/design-tokens

| Version | Date | Notes |
|---|---|---|
| 0.1.0 | 2026-07-13 | Initial token set: color, spacing, radius, shadow, typography, breakpoints, z-index. |
