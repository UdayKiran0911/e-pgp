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

A fifth batch added 10 more modules, deliberately choosing non-AI
stand-ins over the vision doc's LLM-backed versions for Phase 7's
AI-flavored modules (a real Claude API integration is a separate decision
not made this batch — see AI Copilot and Meeting Summarization, left
entirely unbuilt rather than given a hollow non-AI substitute).
Requirement Analyzer (Module 2) is rule-based gap detection
(`RequirementsService.analyze()`) surfaced as a "Flags" column on the
Requirements tab; AI Audit Assistant (Module 3) is a computed audit-log
summary (`AuditLogService.summarize()`) on the Audit Log page; AI Risk
Prediction (Module 4) is a heuristic 0-100 health score
(`ProjectHealthService`) from signals already tracked elsewhere (open
high/critical risks, unresolved high/critical issues, unmet governance
gates, pending sign-offs, blocked deployments), shown as a badge in the
project detail header; Analytics (Module 8) rolls all of that up
org-wide (governance health, audit readiness, adoption) at
`/dashboard/analytics`. Phase 8 gained real Slack/Teams webhook
connectors (Module 4 — the org pastes an incoming-webhook URL, no OAuth
needed on our side; the URL is AES-256-GCM-encrypted at rest via a new
`EncryptionService`, Phase 9 Module 5, and wired as the first real
producer into Deployment Governance decisions alongside the in-app
Notification), a live OpenAPI spec via `@nestjs/swagger` (Module 9 —
`/api-docs` / `/api-docs-json`, also closing out Phase 4's OpenAPI
Specification deliverable; a generated typed `@epg/sdk` package itself is
still deferred, needs a codegen-pipeline decision), and a Plugin
Framework manifest registry (Module 10 — metadata storage and enable/
disable only, no execution sandbox). Phase 9 (Security & Compliance)
moved from Not Started to In Progress on the strength of three
partial modules: Encryption (Module 5, the `EncryptionService` above —
infra-level Postgres/TLS encryption is separate and still unbuilt),
Backup & Recovery (Module 7, an on-demand `ADMIN`-only JSON export of
the org's full data via `OrganizationsService.exportData()` — scheduled/
automated backups are separate and still unbuilt), and Vulnerability
Management (Module 9, a `SecurityFinding` register with the same
severity/status shape as Risk/Issue, as an 11th tab on the — sorry, 12th
now — project detail page grouped into Planning & Tracking; automated
CI dependency/container scanning is separate and still unbuilt). Sample
data seeded for every new register against the same real org/projects.
Full verification remains deferred to the next session per the standing
cadence rule, though the pre-push hook (lint/typecheck/unit tests) will
still run and block the eventual push regardless.

A sixth batch closed out two long-deferred MVP gaps and rounded out Phase
10's engineering baseline. Document Management (Phase 5 Module 7) gained
real file upload/download: a `StorageProvider` interface with a day-1
`LocalDiskStorageService` implementation (`apps/api/src/storage`), so a
future S3-compatible swap won't touch call sites; the Documents tab now
supports uploading a real file alongside the existing external-link
register. Checklist Engine (Phase 5 Module 9) gained templating —
org-level `ChecklistTemplate`s with ordered items, applied to a project
via a snapshot copy (not a live link) — closing the module out fully with
a new sidebar page and an "Apply Template" action on the Checklist tab.
Email Engine (Phase 8 Module 3) shipped as an outbox MVP: an `EmailLog`
row per send rather than a real SMTP/provider integration, wired as a 4th
notification channel into Deployment Governance decisions (audit log,
in-app notification, webhook, and now email), with a read-only viewer
page. Phase 10 picked up five more modules: structured logging
(`nestjs-pino` app-wide), Prometheus metrics (`/metrics`, unauthenticated
by design pending network restriction), base Kubernetes manifests
(`k8s/base/`, Kustomize — environment overlays still deferred), a GHCR
image-publish CD job on push to `main` (deploy-to-cluster itself still
deferred — no cluster/environment decision made), a k6 load-testing script
for the governance workflow endpoints, and `CONTRIBUTING.md` codifying the
session's "flag, don't fake" scope-discipline pattern. Separately, the new
`scripts/contrast-audit.js` (Phase 3 Module 8) found two real WCAG AA
contrast failures on first run; the `warning` token was darkened to fix
one, while the `brand`/violet failure was deliberately left as-is and
flagged rather than silently changing the established brand identity.
Sample data and manual smoke tests (real upload/download round-trip,
template apply, a full 4-channel deployment-approval decision) were
verified against the live API and Neon database. Full lint/typecheck/unit
verification for this batch happens before the push that closes it out,
consistent with the practice of pre-checking locally even though the
standing cadence rule only mandates the pre-push hook itself.

A seventh batch closed out Document Management and Checklist Engine's last
open items and picked up ten more modules spanning Phases 4, 8, 9, and 10.
Document Versioning (Phase 4 Module 6 / Phase 5 Module 7) landed as an
append-only `DocumentVersion` history table — re-uploading a file
snapshots the prior version before overwriting, with a version-history
modal and re-upload flow on the Documents tab. Project custom fields
(Phase 4 Module 7) shipped as a `metadata Json?` column on `Project` (an
opaque key/value map, no per-key schema) with a "Custom Fields" editor on
the project detail page. Phase 4 Module 2 (ER Diagrams) is done via a new
`scripts/generate-er-diagram.js`, regex-parsing `schema.prisma` into a
Mermaid diagram at `docs/ER_DIAGRAM.md` — a snapshot, not continuously
synced, same limitation as every other generated-artifact script in this
repo. Audit Log tamper-evidence (Phase 9 Module 6) added a per-organization
SHA-256 hash chain to `AuditLog` (`hash`/`previousHash`, with a one-off
backfill script for the ~120 pre-existing rows using the exact same hash
formula the service uses going forward) and a `GET /audit-logs/verify`
endpoint with a "Verify Integrity" button on the Audit Log page —
detects tampering, doesn't prevent it against someone with direct DB
access, a documented and deliberate scope limit. Vulnerability Management
(Phase 9 Module 9) picked up real, non-blocking CI scanning: `pnpm audit`
in the lint job and Trivy container scans in the docker-build job, both
`continue-on-error`/`exit-code: 0` for now since the existing dependency
tree has untriaged findings — visibility first, a hard gate is a follow-up.
The SDK (Phase 8 Module 9) is real this time: `packages/sdk` generates
fully-typed `paths` via `openapi-typescript` from a spec snapshot
(`apps/api export:openapi`) and wraps them in a thin `openapi-fetch`
client — every route, method, request, and response is typed with zero
hand-written per-endpoint methods; publishing to a registry remains
deferred. Jira/Azure DevOps/SharePoint/ServiceNow (Phase 8 Modules 5-8)
landed as one shared `ExternalReference` model (a `provider` discriminator,
same trick as `Review`/`GovernanceGate`) — a link, not a sync, attached to
Issue Register entries via a "Links" button and modal. Notification
delivery channels (Phase 8 Module 2) got a real second consumer: the
3-channel fan-out first built inline for Deployment Governance was
extracted into `GovernanceNotifierService` and wired into Change Request
decisions too. Phase 10 rounded out with Kubernetes environment overlays
(`k8s/overlays/{dev,staging,prod}`, replica/resource patches, still no
real per-environment image tags) and Grafana/Prometheus config-as-code
(`k8s/monitoring/`, dashboard JSON + alert rules YAML, no live server
provisioned). Every new endpoint was smoke-tested against the live API and
Neon database end-to-end (document reupload/version history, external
reference linking, audit chain verification staying valid across new
writes, change-request approval fanning out to both a notification and an
email log) after working around an unrelated OneDrive sync-conflict issue
that had corrupted a few local file placeholders — not a code defect, just
an environment hazard of developing inside a synced folder.
