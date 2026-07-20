# Contributing to EPG Platform

Coding standards and the PR review checklist (Phase 10 Module 1). See also
[CLAUDE.md](CLAUDE.md) for the fuller repo-operating rules this distills.

## Coding standards

- **TypeScript everywhere**, strict mode. Shared config lives in
  `packages/tsconfig`; don't loosen compiler options per-app.
- **Lint/format via shared config** — `packages/eslint-config`. Run
  `pnpm lint` before pushing; the pre-push hook runs it anyway and blocks
  on failure.
- **No raw design values** in `apps/web` — colors, spacing, radii, shadows,
  and font sizes must come from `@epg/design-tokens`. This is enforced by
  lint (`no-raw-design-values`) and `pnpm ui-audit`, not a style
  preference. See [UI-standards.md](UI-standards.md).
- **Org-scoped by default** — every new Prisma model that isn't purely
  global takes an `organizationId`, and every service method that reads or
  writes it takes an `organizationId` and filters by it. Cross-org access
  is a security bug, not an edge case.
- **RBAC via `@Roles()`** — write endpoints are gated with
  `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`; reads are open to
  any authenticated org member unless there's a specific reason not to be
  (see `AuditLogController`, `AnalyticsController` for examples of
  read-gated modules).
- **Audit every governed mutation** — write through the shared
  `AuditLogService`, never `prisma.auditLog.create` directly.
- **Tests ship with the code**, not after it. Unit tests for every
  service (mocked Prisma), integration tests for every module against a
  real Postgres instance (org isolation + RBAC assertions are the
  non-negotiable minimum). See any existing `*.service.spec.ts` /
  `test/integration/*.integration-spec.ts` pair as a template.

## Commit and PR checklist

Before opening a PR:

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (unit)
- [ ] `pnpm test:integration` passes against a local Postgres
      (`docker compose up -d postgres`)
- [ ] `pnpm ui-audit` passes for any `apps/web` change
- [ ] New/changed Prisma models have a migration committed
      (`prisma migrate dev --name ...`), not just a schema edit
- [ ] The relevant `roadmap/phaseN.md` checkboxes are updated —
      checked only for what's actually built, with an inline note for
      anything intentionally simplified or deferred
- [ ] `changelog.md` gets an entry after merge (see the `release-cut`
      skill)

The pre-push git hook runs lint + typecheck + unit + integration tests
and blocks the push on failure — don't bypass it with `--no-verify`. Full
e2e (Playwright) runs in CI on every PR, not pre-push (too slow for a
local gate).

## Scope discipline

When a vision-doc module needs a real infra decision this repo hasn't
made yet (a cloud provider, an LLM API key, an external OAuth
integration), don't guess or fake it. Ship the surrounding structure with
an honest, documented simplification instead — see `apps/api/src/storage`
(local disk behind a `StorageProvider` interface, cloud storage deferred)
or `apps/api/src/email` (an outbox log, real provider deferred) for the
pattern. Leave the roadmap checkbox for the deferred piece unchecked with
a one-line reason, not silently skipped.
