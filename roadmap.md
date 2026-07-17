# EPG Platform — Roadmap Index

Active phases live in [roadmap/](roadmap/) as `phaseN.md`, each broken into
**Modules → Tasks → Subtasks → Activities** with `[ ]`/`[x]` checkboxes.
When every checkbox in a phase file is checked, move it to
[roadmap_completed/](roadmap_completed/) and log it in
[roadmap_completed.md](roadmap_completed.md) — the `phase-complete` skill
automates this.

Full product vision: [docs/EPG_Platform_Master_Product_Phases.md](docs/EPG_Platform_Master_Product_Phases.md).

## Phases

| Phase | Title | File | Status |
|---|---|---|---|
| 0 | Product Discovery & Strategy | [roadmap/phase0.md](roadmap/phase0.md) | In Progress |
| 1 | Product Requirements | [roadmap/phase1.md](roadmap/phase1.md) | Not Started |
| 2 | Enterprise Architecture | [roadmap/phase2.md](roadmap/phase2.md) | Not Started |
| 3 | UI / UX Design | [roadmap/phase3.md](roadmap/phase3.md) | In Progress |
| 4 | Data & API Design | [roadmap/phase4.md](roadmap/phase4.md) | In Progress |
| 5 | Core Platform Modules | [roadmap/phase5.md](roadmap/phase5.md) | In Progress |
| 6 | Governance & Delivery Modules | [roadmap/phase6.md](roadmap/phase6.md) | Not Started |
| 7 | Intelligence Platform | [roadmap/phase7.md](roadmap/phase7.md) | Not Started |
| 8 | Platform Engineering | [roadmap/phase8.md](roadmap/phase8.md) | In Progress |
| 9 | Security & Compliance | [roadmap/phase9.md](roadmap/phase9.md) | In Progress |
| 10 | Engineering & DevOps | [roadmap/phase10.md](roadmap/phase10.md) | In Progress |
| 11 | Product Launch | [roadmap/phase11.md](roadmap/phase11.md) | Not Started |
| 12 | Continuous Evolution | [roadmap/phase12.md](roadmap/phase12.md) | Not Started |

## Current focus

Scaffolding (monorepo, design tokens, testing harness, DevOps baseline) is
in place per phases 3, 4, 9, and 10. On top of that, the foundational
product surface is live end-to-end against a real Postgres database:
Authentication (Phase 8), Organization Management, User Management, RBAC,
and Project Portfolio (Phase 5) — register/login, an org-scoped user
directory, role-gated mutations, and governed project status transitions
(with audit-log writes on create/status-change), all verified in both API
and UI. No phase is fully complete yet — none have moved to
[roadmap_completed.md](roadmap_completed.md). Next up per the roadmap:
Governance Workflow (Phase 5 Module 6), or extending audit-log writes to
the remaining governed mutations (Phase 4 Module 5).
