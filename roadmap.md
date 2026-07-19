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
| 6 | Governance & Delivery Modules | [roadmap/phase6.md](roadmap/phase6.md) | In Progress |
| 7 | Intelligence Platform | [roadmap/phase7.md](roadmap/phase7.md) | In Progress |
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
directory, role-gated mutations, and governed project status transitions,
all verified in both API and UI. The audit trail (Phase 4 Module 5) is now
fully wired: every governed mutation across Projects, Users, and
Organizations writes through a shared `AuditLogService`, org-scoped with
an optional project reference. That trail is now visible: Phase 6 Module
13 (Audit Management) adds a `GET /audit-logs` endpoint and an
auditor-facing viewer UI, restricted to `ADMIN`/`GOVERNANCE_LEAD`/`AUDITOR`.
Phase 5 Module 6 (Governance Workflow) is also done: every project now
carries an independent `governanceStage` (INITIATION → PLANNING →
EXECUTION → MONITORING → CLOSURE) advanced one step at a time via a
governed state machine, surfaced as a clickable `Steps` component on the
Project Portfolio table and audit-logged like every other governed
mutation. Also new in Phase 6: Risk Register (Module 8), Decision Log
(Module 9), and Issue Register (Module 10) — a project detail page
(`apps/web/src/app/dashboard/projects/[id]`) now hosts all three as
project-scoped registers, each `ADMIN`/`GOVERNANCE_LEAD`-write and
audit-logged, following the same CRUD+RBAC+audit shape established by
Project Portfolio. Change Requests (Module 7) followed as a 4th tab on the
same project detail page — the first register with a real approval
workflow: any org member can submit, but only `ADMIN`/`GOVERNANCE_LEAD`
can decide (SUBMITTED → APPROVED/REJECTED → IMPLEMENTED). The dashboard
UI also got a full "Glass Gradient" visual pass (violet/cyan gradient
theme, frosted-glass panels, collapsible icon sidebar with an Account
section) — see `packages/design-tokens`. A second batch then landed
Requirements (Phase 6 Module 1), Reviews (Modules 2/5/6 — Architecture/
Security/Performance share one `Review` entity distinguished by `type`,
since the vision doc gives them an identical submit→decide shape), and
Checklist (Phase 5 Module 9, per-project only — no templating layer yet)
as three more tabs on the project detail page, bringing it to seven
registers total. A third batch added five more modules: Department
Management and SOP Library (Phase 5 Modules 2/8 — org-level pages, not
project-scoped, with new sidebar nav entries) plus Document Management
(Phase 5 Module 7, simplified to a link-based register — no S3 storage
integration), Governance Gates (Phase 6 Modules 3/4 — Development/Testing
Governance share one `GovernanceGate` entity the same way Reviews share
one entity, manual attestation rather than real CI wiring), and Customer
Sign-off (Phase 6 Module 11, internal status tracking only — no external
portal/e-signature capture) as three more project-detail tabs, bringing
that page to ten registers total. Real sample data has been seeded across
every register (via the running API against the "Anblicks" org's Risk
Assessment and Governance Rollout projects) so the UI has something to
look at beyond empty tables. Tests for all three batches (Risk/Decision/
Issue Register, Change Requests; Requirements/Reviews/Checklist;
Departments/SOPs/Documents/Governance Gates/Customer Sign-off) are written
but not yet run — verification is being deferred to the end of the
current work session on Phase 6 rather than after each module (see
CLAUDE.md's Testing section). No phase is fully complete yet — none have
moved to [roadmap_completed.md](roadmap_completed.md). Remaining
candidates need either an infra decision already flagged as deferred
(native file storage, real CI integration, an external customer-facing
sign-off portal) or depend on gates this session built (Deployment
Governance, Phase 6 Module 12, can now plausibly gate on Governance Gates
+ Customer Sign-off + Reviews, but that wiring isn't built yet).

A fourth batch closed that last gap and reached into three new phases:
Deployment Governance (Phase 6 Module 12) is now built as an 11th tab on
the project detail page — any member requests it, `ADMIN`/`GOVERNANCE_LEAD`
decide, and the service layer (not just the state machine) blocks an
APPROVED decision unless every Governance Gate is met and every Customer
Sign-off is RECEIVED, notifying the requester through a new Notifications
module (Phase 8 Module 2 — in-app only, system-generated, no email/Slack
delivery channel yet, and only wired into this one flow so far). Phase 7
(Intelligence Platform) is now in progress for the first time: Knowledge
Repository (Module 6) shipped as a manual-entry, tag-searchable reference
library (org-level, new sidebar page) rather than the vision doc's
automated ingestion pipeline, and Enterprise Search (Module 7) shipped as
a keyword `contains` aggregator across every text-bearing register rather
than the vision doc's embeddings-backed semantic search — both explicitly
simplified MVPs, not the full AI-assisted versions. Phase 5 Module 1
(Organization Management) is now fully checked off with a dedicated
`ADMIN`-only settings screen. Given the project detail page reached 10
tabs before this batch (11 after), it was also reorganized per explicit
user request: the flat tab row is now grouped into three top-level
categories — Planning & Tracking, Governance & Reviews, Documents &
Sign-off — each with its own inner tab row, rather than a one-off scroll/
overflow fix or a fuller per-register component split (the latter remains
a flagged future cleanup, not done here). Sample data was seeded for all
5 new modules against the same real "Anblicks" org projects. Tests were
written inline for every new module but, per the standing testing-cadence
rule, a full verification pass has not been run this session either —
still deferred to the next session.
