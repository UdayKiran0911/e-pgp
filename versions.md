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
| 0.9.0 | 2026-07-20 | Document version history modal (view prior versions, re-upload a new one) on the Documents tab; "Custom Fields" editor on the project detail header; "External Refs" links modal (Jira/Azure DevOps/SharePoint/ServiceNow) on the Issue Register tab; "Verify Integrity" button on the Audit Log page. |
| 0.8.0 | 2026-07-20 | New pages Checklist Templates and Email Log; Documents tab gains a real file-upload flow (in addition to the existing external-link register) with download links routed through `API_URL`; Checklist tab gains an "Apply Template" action. |
| 0.7.0 | 2026-07-20 | Project detail page grows to 12 registers (adds Security Findings) plus a project health-score badge in the header; new pages Webhooks, Plugins, Analytics; Audit Log page gains a computed summary card; Organization Settings gains a data-export download button. |
| 0.6.0 | 2026-07-20 | Project detail page grows to 11 registers (Risk, Decision, Issue, Change Request, Requirement, Review, Checklist, Document, Governance Gate, Customer Sign-off, Deployment Approval), reorganized into 3 grouped categories (Planning & Tracking / Governance & Reviews / Documents & Sign-off) to keep the tab bar navigable; new org-level pages (Departments, SOPs, Knowledge Base, Search, Organization Settings); notification bell with unread badge in the sidebar; full "Glass Gradient" visual pass (violet/cyan theme, frosted-glass panels, collapsible icon sidebar). |
| 0.4.0 | 2026-07-19 | Audit Log viewer (Phase 6 Module 13): `apps/web/src/app/dashboard/audit`, nav item gated to `ADMIN`/`GOVERNANCE_LEAD`/`AUDITOR`, actor names resolved against the org's user list. |
| 0.3.0 | 2026-07-17 | Project Portfolio UI (dashboard nav, status/health table with governed inline transitions), fixed antd `message`/`Alert` deprecations by adopting `App.useApp()`. |
| 0.2.0 | 2026-07-14 | Auth UI: login/register pages, `AuthProvider` context, `RequireAuth` guard, dashboard shell with org-scoped user management table. |
| 0.1.0 | 2026-07-13 | Initial scaffold: Next.js 16 App Router + Ant Design 6, design tokens wired in, homepage placeholder. |

## apps/api

| Version | Date | Notes |
|---|---|---|
| 0.9.0 | 2026-07-20 | Document Versioning (`DocumentVersion` history table + reupload endpoint), Project custom metadata (`metadata Json?`), audit log tamper-evidence (per-org SHA-256 hash chain + `/audit-logs/verify`), `ExternalReference` links (Jira/Azure DevOps/SharePoint/ServiceNow, shared model), `GovernanceNotifierService` extracted and wired into Change Requests, CI dependency/container vulnerability scanning (`pnpm audit` + Trivy, non-blocking). |
| 0.8.0 | 2026-07-20 | Checklist Templates (org-level, applied to a project via snapshot copy — closes out Checklist Engine), native document upload/download (`StorageProvider` interface + `LocalDiskStorageService`), Email Engine outbox (`EmailLog`, wired as a 4th Deployment Governance notification channel), structured logging (`nestjs-pino`), Prometheus metrics (`/metrics`), and a k6 performance-testing script. |
| 0.7.0 | 2026-07-20 | Ten more modules, favoring non-AI stand-ins for Phase 7's LLM-flavored ones: Requirement Analyzer (rule-based flags), AI Audit Assistant (computed summary), AI Risk Prediction (heuristic `ProjectHealthService` score), Analytics (org-wide rollup of the above). Plus Webhook Connectors (Slack/Teams, AES-256-GCM-encrypted URLs via a new `EncryptionService`), Plugin Framework (manifest registry), Security Findings (Vulnerability Management register), a live OpenAPI spec (`@nestjs/swagger`), and on-demand Organization data export (Backup & Recovery). |
| 0.6.0 | 2026-07-20 | Fourteen new modules on top of the audit trail and governance workflow: Risk/Decision/Issue Registers, Change Requests, Requirements, Reviews (Architecture/Security/Performance), Checklist, Departments, SOPs, Documents, Governance Gates, Customer Sign-off, Deployment Approvals (service-layer-enforced block on required gates/sign-offs, per Phase 6 Module 12), Notifications (in-app, system-generated), Knowledge Articles, and cross-register Enterprise Search — all org-scoped, RBAC-gated, and audit-logged following the established CRUD shape; `Review` and `GovernanceGate` each share one entity across multiple vision-doc modules via a type/category discriminator. |
| 0.5.0 | 2026-07-19 | Governance Workflow (Phase 5 Module 6): `Project.governanceStage` (INITIATION → PLANNING → EXECUTION → MONITORING → CLOSURE), a strictly sequential state machine (`governance-stage.ts`) enforced in `ProjectsService.update`, writes a `GOVERNANCE_STAGE_ADVANCED` audit log entry. |
| 0.4.0 | 2026-07-19 | Audit Log viewer API (Phase 6 Module 13): `GET /audit-logs` (`AuditLogController`), org-scoped and newest-first with the related project attached, restricted to `ADMIN`/`GOVERNANCE_LEAD`/`AUDITOR`. |
| 0.3.0 | 2026-07-17 | Closed the audit-log gap (Phase 4 Module 5): re-scoped `AuditLog` to the Organization (required) with an optional Project reference, migrated live data with a backfill step, and extracted a shared `AuditLogService` now used by every governed mutation (Project create/status-change, User role-change/activate/deactivate, Organization rename). |
| 0.2.0 | 2026-07-17 | Project Portfolio: `ProjectModule` CRUD with a governed status-transition state machine and audit-log writes on create/status-change. Fixed a real Prisma 7 WASM/Jest incompatibility (`--experimental-vm-modules`) blocking integration tests, and the health check's overly strict 1s timeout. |
| 0.1.0 | 2026-07-14 | Authentication (register/login/me, JWT + bcryptjs), Organization Management, User Management, and RBAC (`RolesGuard` + `@Roles()`). Adds `passwordHash`/`isActive` to `User`. |
| 0.0.1 | 2026-07-13 | Initial scaffold: NestJS + Prisma (PostgreSQL via `@prisma/adapter-pg`), health check, base schema (Organization/User/Project/AuditLog). |

## packages/sdk

| Version | Date | Notes |
|---|---|---|
| 0.1.0 | 2026-07-20 | Initial release: `@epg/sdk` generates fully-typed `paths` via `openapi-typescript` from a snapshot of the live OpenAPI spec, wrapped in a thin `openapi-fetch`-based `createEpgClient()`. Consumed as a workspace dependency; not published to a registry. |

## packages/design-tokens

| Version | Date | Notes |
|---|---|---|
| 0.2.1 | 2026-07-20 | Darkened `color.warning[500]` (`#c98a05` → `#a66c03`) to fix a WCAG AA contrast failure (`warning` on `warningBg`, 2.54:1 → 3.80:1) found by the new `scripts/contrast-audit.js`; found simultaneously, a `brand`/`bgBase` failure (4.23:1) is deliberately left unfixed since correcting it would change the brand identity itself. |
| 0.2.0 | 2026-07-14 | Add `containerWidth` scale for centered content containers (auth cards, narrow forms, dialogs). |
| 0.1.0 | 2026-07-13 | Initial token set: color, spacing, radius, shadow, typography, breakpoints, z-index. |
