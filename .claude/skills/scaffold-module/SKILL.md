---
name: scaffold-module
description: Scaffold a new governance module - a NestJS resource (module/controller/service/DTOs + Prisma model) and matching Next.js UI (list/detail screens), with unit tests for both, wired into the relevant roadmap/phaseN.md as checked-off Activities. Use when starting work on a new Module named in roadmap/phaseN.md (e.g. "Risk Register", "Decision Log", "Checklist Engine").
---

# Scaffold Module

Generates the boilerplate for one Module from `roadmap/phaseN.md` (Phase 5
and Phase 6 modules are the common case) so every module starts from the
same shape: API resource, UI screen, tests for both, and the roadmap
checkboxes updated to reflect what was actually created.

## When to use this

The user says something like "scaffold the Risk Register module" or "start
Module 8 in phase6.md". Confirm which phase/module first if it's ambiguous
— check `roadmap/phaseN.md` for the exact module name and its Tasks.

## Steps

1. **Read the module's spec.** Open the relevant `roadmap/phaseN.md` and
   find the Module's Tasks/Subtasks/Activities. This tells you what fields
   /operations the resource needs — don't invent scope beyond what's there.

2. **Prisma model** (if the module needs new persisted data not already in
   `apps/api/prisma/schema.prisma`):
   - Add the model, run `npx prisma format` then `npx prisma generate` in
     `apps/api`.
   - Follow existing conventions: `id String @id @default(uuid())`,
     `createdAt`/`updatedAt`, relation to `Organization` or `Project` where
     it makes sense, and an `AuditLog` write path for governed mutations
     (see Phase 4 Module 5 / Phase 9 Module 6).

3. **NestJS resource** under `apps/api/src/<module-name>/`:
   - `<module>.module.ts`, `<module>.controller.ts`, `<module>.service.ts`
   - DTOs with `class-validator` decorators (matches existing
     `ValidationPipe` config in `main.ts`)
   - Register the module in `apps/api/src/app.module.ts`
   - Add role checks per Phase 5 Module 4 (RBAC) if the module is
     governance-sensitive — don't skip this for anything auditors/admins
     need restricted from members.
   - Unit test (`*.spec.ts`) for the service's core logic — no DB required.
   - Integration test (`test/integration/*.integration-spec.ts`) that
     exercises the real Prisma-backed CRUD path.

4. **Next.js UI** under `apps/web/src/app/<route>/`:
   - `"use client"` at the top if it uses any antd namespaced sub-component
     (`Layout.Header`, `Table.Column`, etc.) — see the RSC gotcha in
     [CLAUDE.md](../../../CLAUDE.md). Ordinary named exports are fine either
     way, but default to `"use client"` for anything interactive.
   - Build every color/spacing/radius value from `@epg/design-tokens` — run
     `pnpm ui-audit` on the new files before moving on (or invoke the
     `ui-audit` skill).
   - Unit test with Vitest + Testing Library for the screen's rendering
     and key interactions.

5. **Update the roadmap.** In `roadmap/phaseN.md`, check off `[x]` the
   Activities/Subtasks/Tasks you actually completed. Don't check off ones
   you didn't do (e.g. if you only built the API, leave UI tasks
   unchecked). If every checkbox in the phase is now `[x]`, tell the user
   and offer to run the `phase-complete` skill — don't do it automatically,
   phase completion is a deliberate call.

6. **Verify before handing back**: run `pnpm lint`, `pnpm typecheck`,
   `pnpm test` (and `pnpm test:integration` if you touched Prisma, with
   `docker compose up -d postgres` running) for the affected app(s). Fix
   failures — don't report the module as scaffolded if these don't pass.

## What NOT to do

- Don't scaffold UI for a module whose Task list only asked for API work
  (or vice versa) — match what the roadmap file actually specifies.
- Don't invent extra CRUD endpoints/fields beyond what the module's
  Tasks/Subtasks describe. Extend the roadmap file first if scope is
  genuinely missing, then build to the updated spec.
- Don't skip the audit-log write path for governance-sensitive mutations —
  that's the whole point of this platform (see the Guiding Principles in
  `docs/EPG_Platform_Master_Product_Phases.md`).
