# EPG Platform — Changelog

Commit-level changelog. One entry per meaningful commit (or squashed PR):
date, short hash, description. Maintained by the `release-cut` skill; also
updated by hand when merging any PR.

Format: `YYYY-MM-DD | <short-hash> | <description>`

---

<!-- Newest entries at the top -->

2026-07-20 | 788311f | Add 10 modules: Document Versioning (`DocumentVersion` history + re-upload), Project custom metadata (`metadata Json?`), Audit Log tamper-evidence (per-org SHA-256 hash chain + `/audit-logs/verify`), a real generated `@epg/sdk` typed client, `ExternalReference` links (Jira/Azure DevOps/SharePoint/ServiceNow), `GovernanceNotifierService` extracted and wired into Change Requests, Kubernetes environment overlays, Grafana/Prometheus config-as-code, non-blocking CI vulnerability scanning (`pnpm audit` + Trivy), and a generated `docs/ER_DIAGRAM.md`.

2026-07-20 | def7331 | Add 10 modules: Checklist Templates (org-level, applied to a project via snapshot copy — closes out Checklist Engine), native document upload/download (`StorageProvider` interface + `LocalDiskStorageService`), Email Engine outbox (`EmailLog`, 4th Deployment Governance notification channel), structured logging (pino), Prometheus metrics, base Kubernetes manifests, a GHCR image-publish CD job, a k6 load-testing script, and `CONTRIBUTING.md`. Also fixed a real WCAG AA contrast failure (`warning` token) found by a new `scripts/contrast-audit.js`.

2026-07-20 | ffbe76c | Add 10 modules across Phases 7-9: Requirement Analyzer, AI Audit Assistant, and AI Risk Prediction as rule-based/computed/heuristic MVPs (no LLM integration decision made) plus org-wide Analytics; Slack/Teams webhook connectors with AES-256-GCM-encrypted secrets; Plugin Framework manifest registry; Security Findings register; live OpenAPI spec; on-demand Organization data export.

2026-07-20 | f956ae9 | Add Audit Management, Governance Workflow, and 15 governance/delivery modules: Risk/Decision/Issue Registers, Change Requests, Requirements, Reviews, Checklist, Departments, SOPs, Documents, Governance Gates, Customer Sign-off, Deployment Approvals, Notifications, Knowledge Articles, and Enterprise Search; project detail page reorganized into 3 grouped tab categories; "Glass Gradient" visual redesign. Follow-up commits (7a4b3fc, b14f4c8, 33ca480, b3e0de1) fixed lint/typecheck/unit-test issues surfaced by the pre-push hook.

2026-07-19 | adc3465 | Close the audit-log gap: re-scoped AuditLog to Organization (optional Project), migrated live data with a backfill step, extracted shared AuditLogService now used by every governed mutation (Project, User, Organization).

2026-07-17 | 144250b | Add Project Portfolio: ProjectModule CRUD with a governed status-transition state machine and audit-log writes; Project Portfolio dashboard UI; fixed Prisma 7 WASM/Jest incompatibility and antd message/App.useApp() deprecation.

2026-07-17 | 013cb45 | Fix health check timeout (1s too strict for a remote database) and antd v6 Alert/Space deprecation warnings.

2026-07-14 | 4cd81aa | Add Authentication, Organization Management, User Management, and RBAC (apps/api: register/login/me, JWT + bcryptjs, RolesGuard; apps/web: login/register pages, dashboard user management table).

2026-07-14 | 1d02763 | Initial scaffold: pnpm/Turborepo monorepo, apps/web (Next.js + Ant Design) and apps/api (NestJS + Prisma/PostgreSQL), design tokens + UI-standards enforcement, roadmap system, Claude Code skills, testing harness with pre-push gate, Docker + GitHub Actions CI.
