# Phase 6 — Governance & Delivery Modules

**Status:** In Progress
**Deliverables:** Workflow Specifications, Approval Matrix, Audit Rules

## Modules

### Module 1: Requirements
- [x] Task 1.1: Build requirements tracking within a governed project
  - [x] Subtask 1.1.1: API + UI for linking requirements to projects
    - [x] Activity: `RequirementModule` CRUD (`apps/api/src/requirements`) — `ADMIN`/`GOVERNANCE_LEAD` write, free-form status (DRAFT/APPROVED/IMPLEMENTED), audit-logged (`REQUIREMENT_CREATED`, `REQUIREMENT_STATUS_CHANGED`)
    - [x] Activity: Requirements traceability screen — a tab on the project detail page (`apps/web/src/app/dashboard/projects/[id]`)

### Module 2: Architecture Reviews
- [x] Task 2.1: Build an architecture review workflow
  - [x] Subtask 2.1.1: Review submission and sign-off
    - [x] Activity: Architecture review request form — modeled as one `Review` entity shared with Modules 5/6 (`type: ARCHITECTURE | SECURITY | PERFORMANCE`), since all three vision-doc modules share an identical submit → decide shape; see `apps/api/src/reviews`
    - [x] Activity: Review outcome tracking (approved/changes requested) — `review-status.ts` state machine (SUBMITTED → APPROVED/CHANGES_REQUESTED, CHANGES_REQUESTED can resubmit), any member submits, `ADMIN`/`GOVERNANCE_LEAD` decides, audit-logged (`REVIEW_SUBMITTED`, `REVIEW_STATUS_CHANGED`)

### Module 3: Development Governance
- [x] Task 3.1: Enforce development governance gates
  - [x] Subtask 3.1.1: Define gate criteria (code review, coverage thresholds)
    - [x] Activity: Document required gates before a project can advance stage — modeled as one `GovernanceGate` entity shared with Module 4 (`category: DEVELOPMENT | TESTING`), same trick as `Review`; see `apps/api/src/governance-gates`. Attestation is manual (`isMet` toggle), not a blocking check against `governanceStage` transitions yet

### Module 4: Testing Governance
- [ ] Task 4.1: Enforce testing governance gates
  - [ ] Subtask 4.1.1: Define minimum test evidence required per stage
    - [x] Activity: Gate criteria — `category: TESTING` on the shared `GovernanceGate` entity (see Module 3)
    - [ ] Activity: Wire CI test results into the project's governance record — not built; deliberately deferred, needs a real CI integration decision rather than manual attestation

### Module 5: Security Reviews
- [x] Task 5.1: Build a security review workflow
  - [x] Subtask 5.1.1: Security checklist + sign-off
    - [x] Activity: Security review request form — `type: SECURITY` on the shared `Review` entity (see Module 2)
    - [ ] Activity: Link findings to the Risk Register — not built; a security review's description is free text for now, no structured link to `Risk` rows yet

### Module 6: Performance Reviews
- [x] Task 6.1: Build a performance review workflow
  - [x] Subtask 6.1.1: Performance benchmark submission
    - [x] Activity: Performance review form — `type: PERFORMANCE` on the shared `Review` entity (see Module 2)
    - [ ] Activity: Evidence attachment — no file upload yet (depends on the Document Management module's storage decision, Phase 5 Module 7)

### Module 7: Change Requests
- [x] Task 7.1: Build change request management
  - [x] Subtask 7.1.1: API + UI for submitting/approving change requests
    - [x] Activity: `ChangeRequestModule` CRUD with approval workflow (`apps/api/src/change-requests`) — the first register with a real state machine (`change-request-status.ts`: SUBMITTED → APPROVED/REJECTED → IMPLEMENTED, REJECTED/IMPLEMENTED terminal); any authenticated org member can submit, only `ADMIN`/`GOVERNANCE_LEAD` can decide, audit-logged (`CHANGE_REQUEST_SUBMITTED`, `CHANGE_REQUEST_STATUS_CHANGED`); UI as a 4th tab on the project detail page

### Module 8: Risk Register
- [x] Task 8.1: Build the risk register
  - [x] Subtask 8.1.1: API + UI for logging and tracking risks
    - [x] Activity: `RiskModule` CRUD with severity/likelihood scoring (`apps/api/src/risks`) — org-scoped, project-scoped, `ADMIN`/`GOVERNANCE_LEAD` write, audit-logged (`RISK_CREATED`, `RISK_STATUS_CHANGED`); UI on the project detail page (`apps/web/src/app/dashboard/projects/[id]`)

### Module 9: Decision Log
- [x] Task 9.1: Build the decision log
  - [x] Subtask 9.1.1: API + UI for recording key decisions
    - [x] Activity: `DecisionModule` CRUD tied to project timeline (`apps/api/src/decisions`) — `decidedAt` fixed at creation so ordering never shifts, audit-logged (`DECISION_LOGGED`, `DECISION_UPDATED`); UI on the project detail page

### Module 10: Issue Register
- [x] Task 10.1: Build the issue register
  - [x] Subtask 10.1.1: API + UI for logging and resolving issues
    - [x] Activity: `IssueModule` CRUD with status tracking (`apps/api/src/issues`) — same shape as Risk Register (priority instead of severity/likelihood), audit-logged (`ISSUE_CREATED`, `ISSUE_STATUS_CHANGED`); UI on the project detail page

### Module 11: Customer Sign-off
- [ ] Task 11.1: Build the customer sign-off workflow
  - [ ] Subtask 11.1.1: External sign-off portal integration
    - [x] Activity: Sign-off request + internal status tracking (`apps/api/src/customer-signoffs`) — `ADMIN`/`GOVERNANCE_LEAD` requests and records the outcome (PENDING/RECEIVED/DECLINED), audit-logged (`CUSTOMER_SIGNOFF_REQUESTED`, `CUSTOMER_SIGNOFF_STATUS_CHANGED`); UI as a tab on the project detail page
    - [ ] Activity: External sign-off portal + e-signature capture — not built; deliberately deferred, this is a customer-facing surface outside the internal dashboard, a separate build

### Module 12: Deployment Governance
- [x] Task 12.1: Gate production deployment on governance completion
  - [x] Subtask 12.1.1: Deployment approval checklist
    - [x] Activity: `DeploymentApprovalModule` (`apps/api/src/deployment-approvals`) — any member requests, `ADMIN`/`GOVERNANCE_LEAD` decide (`deployment-status.ts`: REQUESTED → APPROVED/BLOCKED, BLOCKED can be re-requested); block deployment record until required sign-offs exist is enforced in the service layer, not just the state machine — `assertGovernanceReady` rejects an APPROVED decision unless every `GovernanceGate` on the project is met and every `CustomerSignoff` is RECEIVED; audit-logged (`DEPLOYMENT_APPROVAL_REQUESTED`, `DEPLOYMENT_APPROVAL_STATUS_CHANGED`) and notifies the requester via the new Notifications module (Phase 8 Module 2); UI as an 11th tab on the project detail page, under the "Governance & Reviews" category

### Module 13: Audit Management
- [x] Task 13.1: Build the audit management view
  - [x] Subtask 13.1.1: Aggregate all `AuditLog` entries per organization (broader than per-project — every governed action across Projects, Users, and Organizations)
    - [x] Activity: `GET /audit-logs` (`apps/api/src/audit/audit-log.controller.ts`), restricted to `ADMIN`/`GOVERNANCE_LEAD`/`AUDITOR`, org-scoped and newest-first with the related project attached
    - [x] Activity: Auditor-facing timeline view of every governed action (`apps/web/src/app/dashboard/audit`) — actor resolved client-side against the org's user list, nav item hidden for `MEMBER`

## Deliverables Checklist
- [ ] Workflow Specifications
- [ ] Approval Matrix
- [ ] Audit Rules
