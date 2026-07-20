# EPG Platform — Changelog

Commit-level changelog. One entry per meaningful commit (or squashed PR):
date, short hash, description. Maintained by the `release-cut` skill; also
updated by hand when merging any PR.

Format: `YYYY-MM-DD | <short-hash> | <description>`

---

<!-- Newest entries at the top -->

2026-07-20 | ffbe76c | Add 10 modules across Phases 7-9: Requirement Analyzer, AI Audit Assistant, and AI Risk Prediction as rule-based/computed/heuristic MVPs (no LLM integration decision made) plus org-wide Analytics; Slack/Teams webhook connectors with AES-256-GCM-encrypted secrets; Plugin Framework manifest registry; Security Findings register; live OpenAPI spec; on-demand Organization data export.

2026-07-20 | f956ae9 | Add Audit Management, Governance Workflow, and 15 governance/delivery modules: Risk/Decision/Issue Registers, Change Requests, Requirements, Reviews, Checklist, Departments, SOPs, Documents, Governance Gates, Customer Sign-off, Deployment Approvals, Notifications, Knowledge Articles, and Enterprise Search; project detail page reorganized into 3 grouped tab categories; "Glass Gradient" visual redesign. Follow-up commits (7a4b3fc, b14f4c8, 33ca480, b3e0de1) fixed lint/typecheck/unit-test issues surfaced by the pre-push hook.

2026-07-19 | adc3465 | Close the audit-log gap: re-scoped AuditLog to Organization (optional Project), migrated live data with a backfill step, extracted shared AuditLogService now used by every governed mutation (Project, User, Organization).

2026-07-17 | 144250b | Add Project Portfolio: ProjectModule CRUD with a governed status-transition state machine and audit-log writes; Project Portfolio dashboard UI; fixed Prisma 7 WASM/Jest incompatibility and antd message/App.useApp() deprecation.

2026-07-17 | 013cb45 | Fix health check timeout (1s too strict for a remote database) and antd v6 Alert/Space deprecation warnings.

2026-07-14 | 4cd81aa | Add Authentication, Organization Management, User Management, and RBAC (apps/api: register/login/me, JWT + bcryptjs, RolesGuard; apps/web: login/register pages, dashboard user management table).

2026-07-14 | 1d02763 | Initial scaffold: pnpm/Turborepo monorepo, apps/web (Next.js + Ant Design) and apps/api (NestJS + Prisma/PostgreSQL), design tokens + UI-standards enforcement, roadmap system, Claude Code skills, testing harness with pre-push gate, Docker + GitHub Actions CI.
