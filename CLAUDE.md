# EPG Platform — CLAUDE.md

Enterprise Project Governance Platform: the operating system for project
delivery — standardized, auditable, compliant, and intelligent workflows.
Full phase-by-phase vision: [docs/EPG_Platform_Master_Product_Phases.md](docs/EPG_Platform_Master_Product_Phases.md).

**Motto:** Standardize. Govern. Audit. Deliver.

## Repo layout

```
apps/
  web/    Next.js 16 (App Router) + TypeScript + Ant Design 6 — frontend
  api/    NestJS + TypeScript + Prisma (PostgreSQL) — backend
packages/
  design-tokens/   Single source of truth for color/spacing/radius/typography
  eslint-config/   Shared ESLint rule that bans raw colors/px outside tokens
  tsconfig/        Shared base tsconfig
docs/                              Source vision/strategy docs
roadmap.md + roadmap/phaseN.md     Active phase plans (Modules→Tasks→Subtasks→Activities)
roadmap_completed.md + roadmap_completed/  Finished phases move here
versions.md                        Version history per app
changelog.md                       Commit-level changelog (date, hash, description)
UI-standards.md                    Design system rules — no isolated colors/sizes/shapes
```

This is a real, production-grade, deployable project — not a prototype. Every
change should be something you'd be comfortable shipping.

## Commands

Run from the repo root (Turborepo fans these out to both apps):

```bash
pnpm dev             # run web + api in dev mode
pnpm build           # build both apps
pnpm lint            # eslint across the workspace
pnpm typecheck       # tsc --noEmit across the workspace
pnpm test            # unit tests (Vitest for web, Jest for api)
pnpm test:integration # integration tests — require Postgres running (docker compose up -d postgres)
pnpm test:e2e        # Playwright (web) / Jest e2e (api) — full stack, run in CI
pnpm ui-audit        # scans changed frontend files for raw color/size violations
```

Per-app equivalents live in `apps/web/package.json` and `apps/api/package.json`.

## Testing — non-negotiable, but batched by phase for now

Testing is not optional on this project. Every change to application code
must ship with tests that exercise it (unit at minimum; integration when it
touches the database; e2e for user-facing flows) — write them inline with
the code, don't skip them.

**Cadence while the platform is still taking shape (current mode):** don't
stop to run the full lint/typecheck/unit/integration cycle, or do manual
browser/API verification, after every individual module. There are many
phases and modules ahead — build out a phase's modules first, then run one
full verification pass at the end of the phase. This changes *when*
verification happens during a work session, not whether it happens: a
pre-push git hook still runs lint + typecheck + unit + integration tests
and **blocks the push** if any fail — do not bypass it with `--no-verify`
— so everything must pass before it ships regardless of this cadence.
Once the app takes a more complete shape, this reverts to per-module
testing.

Full E2E runs in CI on every PR, not pre-push (too slow for a local gate).

## The roadmap workflow

- `roadmap/phaseN.md` holds the active plan for phase N, broken into
  **Modules → Tasks → Subtasks → Activities**, each with a `[ ]`/`[x]`
  checkbox. Check items off as they're completed — don't just remember it.
- `roadmap.md` is the index: one line per phase linking to its file, plus
  overall status.
- When an entire phase's checkboxes are all `[x]`, use the `phase-complete`
  skill (or do it manually): move `roadmap/phaseN.md` to
  `roadmap_completed/phaseN.md`, add a line to `roadmap_completed.md`, and
  add an entry to `changelog.md`.
- Never delete a phase file — it either lives in `roadmap/` (active) or
  `roadmap_completed/` (done).

## UI standards — no isolated colors, sizes, or shapes

Every color, spacing value, border-radius, shadow, and font size must come
from `packages/design-tokens`. Raw hex colors, `rgb()`/`rgba()`, and
arbitrary `px` values in style props are lint errors (see
`packages/eslint-config/no-raw-design-values.mjs`), not style preferences.
Full rules: [UI-standards.md](UI-standards.md). Run `pnpm ui-audit` before
committing any frontend change.

## Ant Design + Next.js App Router: the one gotcha to know

Ant Design components that expose sub-components as **runtime properties**
attached to the parent after module evaluation (`Layout.Header`,
`Layout.Content`, `Menu.Item`, `Steps.Step`, etc. — anything accessed via dot
notation rather than a real named export) **lose that property across the
React Server Component boundary**. Next.js proxies "use client" modules by
their statically-declared exports only; a property mutated onto the default
export at runtime resolves to `undefined` on the server, producing
`Element type is invalid: ... got undefined`.

**Rule:** any file that touches one of these dot-accessed antd
sub-components must start with `"use client";`. Plain named exports
(`ConfigProvider`, `Button`, `Card`, `Typography.Title` used the same way,
etc.) are generally fine either way, but when in doubt, mark the page/component
`"use client"` — this app is an internal governance dashboard, not a
content site, so losing RSC-level SSR on interactive pages is an acceptable
and expected trade-off.

## Model

Default model for this project is Sonnet (see `.claude/settings.json`).

## Skills

See `.claude/skills/` — `scaffold-module`, `phase-complete`, `ui-audit`,
`release-cut`. Use them instead of doing the equivalent steps by hand so the
roadmap, changelog, and versions files stay consistent.
