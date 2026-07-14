# Phase 6 — Governance & Delivery Modules

**Status:** Not Started
**Deliverables:** Workflow Specifications, Approval Matrix, Audit Rules

## Modules

### Module 1: Requirements
- [ ] Task 1.1: Build requirements tracking within a governed project
  - [ ] Subtask 1.1.1: API + UI for linking requirements to projects
    - [ ] Activity: `RequirementModule` CRUD
    - [ ] Activity: Requirements traceability screen

### Module 2: Architecture Reviews
- [ ] Task 2.1: Build an architecture review workflow
  - [ ] Subtask 2.1.1: Review submission and sign-off
    - [ ] Activity: Architecture review request form + reviewer assignment
    - [ ] Activity: Review outcome tracking (approved/changes requested)

### Module 3: Development Governance
- [ ] Task 3.1: Enforce development governance gates
  - [ ] Subtask 3.1.1: Define gate criteria (code review, coverage thresholds)
    - [ ] Activity: Document required gates before a project can advance stage

### Module 4: Testing Governance
- [ ] Task 4.1: Enforce testing governance gates
  - [ ] Subtask 4.1.1: Define minimum test evidence required per stage
    - [ ] Activity: Wire CI test results into the project's governance record

### Module 5: Security Reviews
- [ ] Task 5.1: Build a security review workflow
  - [ ] Subtask 5.1.1: Security checklist + sign-off
    - [ ] Activity: Security review request form
    - [ ] Activity: Link findings to the Risk Register

### Module 6: Performance Reviews
- [ ] Task 6.1: Build a performance review workflow
  - [ ] Subtask 6.1.1: Performance benchmark submission
    - [ ] Activity: Performance review form + evidence attachment

### Module 7: Change Requests
- [ ] Task 7.1: Build change request management
  - [ ] Subtask 7.1.1: API + UI for submitting/approving change requests
    - [ ] Activity: `ChangeRequestModule` CRUD with approval workflow

### Module 8: Risk Register
- [ ] Task 8.1: Build the risk register
  - [ ] Subtask 8.1.1: API + UI for logging and tracking risks
    - [ ] Activity: `RiskModule` CRUD with severity/likelihood scoring

### Module 9: Decision Log
- [ ] Task 9.1: Build the decision log
  - [ ] Subtask 9.1.1: API + UI for recording key decisions
    - [ ] Activity: `DecisionLogModule` CRUD tied to project timeline

### Module 10: Issue Register
- [ ] Task 10.1: Build the issue register
  - [ ] Subtask 10.1.1: API + UI for logging and resolving issues
    - [ ] Activity: `IssueModule` CRUD with status tracking

### Module 11: Customer Sign-off
- [ ] Task 11.1: Build the customer sign-off workflow
  - [ ] Subtask 11.1.1: External sign-off portal integration
    - [ ] Activity: Sign-off request + e-signature capture flow

### Module 12: Deployment Governance
- [ ] Task 12.1: Gate production deployment on governance completion
  - [ ] Subtask 12.1.1: Deployment approval checklist
    - [ ] Activity: Block deployment record until required sign-offs exist

### Module 13: Audit Management
- [ ] Task 13.1: Build the audit management view
  - [ ] Subtask 13.1.1: Aggregate all `AuditLog` entries per project
    - [ ] Activity: Auditor-facing timeline view of every governed action

## Deliverables Checklist
- [ ] Workflow Specifications
- [ ] Approval Matrix
- [ ] Audit Rules
