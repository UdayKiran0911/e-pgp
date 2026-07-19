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
| 0.3.0 | 2026-07-17 | Project Portfolio UI (dashboard nav, status/health table with governed inline transitions), fixed antd `message`/`Alert` deprecations by adopting `App.useApp()`. |
| 0.2.0 | 2026-07-14 | Auth UI: login/register pages, `AuthProvider` context, `RequireAuth` guard, dashboard shell with org-scoped user management table. |
| 0.1.0 | 2026-07-13 | Initial scaffold: Next.js 16 App Router + Ant Design 6, design tokens wired in, homepage placeholder. |

## apps/api

| Version | Date | Notes |
|---|---|---|
| 0.3.0 | 2026-07-17 | Closed the audit-log gap (Phase 4 Module 5): re-scoped `AuditLog` to the Organization (required) with an optional Project reference, migrated live data with a backfill step, and extracted a shared `AuditLogService` now used by every governed mutation (Project create/status-change, User role-change/activate/deactivate, Organization rename). |
| 0.2.0 | 2026-07-17 | Project Portfolio: `ProjectModule` CRUD with a governed status-transition state machine and audit-log writes on create/status-change. Fixed a real Prisma 7 WASM/Jest incompatibility (`--experimental-vm-modules`) blocking integration tests, and the health check's overly strict 1s timeout. |
| 0.1.0 | 2026-07-14 | Authentication (register/login/me, JWT + bcryptjs), Organization Management, User Management, and RBAC (`RolesGuard` + `@Roles()`). Adds `passwordHash`/`isActive` to `User`. |
| 0.0.1 | 2026-07-13 | Initial scaffold: NestJS + Prisma (PostgreSQL via `@prisma/adapter-pg`), health check, base schema (Organization/User/Project/AuditLog). |

## packages/design-tokens

| Version | Date | Notes |
|---|---|---|
| 0.2.0 | 2026-07-14 | Add `containerWidth` scale for centered content containers (auth cards, narrow forms, dialogs). |
| 0.1.0 | 2026-07-13 | Initial token set: color, spacing, radius, shadow, typography, breakpoints, z-index. |
