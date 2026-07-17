# Phase 5 — Core Platform Modules

**Status:** In Progress
**Deliverables:** Module Specifications, Business Rules, Screen Specifications

## Modules

### Module 1: Organization Management
- [x] Task 1.1: Build organization CRUD
  - [x] Subtask 1.1.1: API layer
    - [x] Activity: NestJS `OrganizationModule` (controller, service, DTOs) — read/update scoped to the caller's own org via `GET/PATCH /organizations/me`
    - [x] Activity: Unit + integration tests for organization CRUD
  - [x] Subtask 1.1.2: UI layer
    - [x] Activity: Organization name shown on the dashboard shell (see Module 3's dashboard screen)
    - [ ] Activity: Dedicated organization settings/edit screen (rename, etc.)

### Module 2: Department Management
- [ ] Task 2.1: Build department hierarchy under an organization
  - [ ] Subtask 2.1.1: API layer
    - [ ] Activity: `DepartmentModule` with parent/child relationships
  - [ ] Subtask 2.1.2: UI layer
    - [ ] Activity: Department tree view screen

### Module 3: User Management
- [x] Task 3.1: Build user CRUD and profile management
  - [x] Subtask 3.1.1: API layer
    - [x] Activity: `UserModule` (invite via `POST /users`, update role/deactivate via `PATCH /users/:id`, org-scoped `GET /users`, `GET /users/:id`)
  - [x] Subtask 3.1.2: UI layer
    - [x] Activity: User management table with role badges (`apps/web/src/app/dashboard/page.tsx`) — inline role `Select` and activate/deactivate action for admins

### Module 4: RBAC
- [x] Task 4.1: Implement role-based access control
  - [x] Subtask 4.1.1: Define roles/permissions model
    - [x] Activity: Map `Role` enum (`ADMIN`, `GOVERNANCE_LEAD`, `MEMBER`, `AUDITOR`) to permissions — `ADMIN`-only for user creation/mutation, all roles can read
  - [x] Subtask 4.1.2: Enforce RBAC in API and UI
    - [x] Activity: NestJS guard for role-based route protection (`RolesGuard` + `@Roles()` decorator, `apps/api/src/auth/guards`)
    - [x] Activity: Conditional UI rendering based on role (dashboard hides mutation controls from non-admins)

### Module 5: Project Portfolio
- [x] Task 5.1: Build the project portfolio view
  - [x] Subtask 5.1.1: API layer
    - [x] Activity: `ProjectModule` CRUD with status transitions (`apps/api/src/projects`) — governed lifecycle (DRAFT→ACTIVE→ON_HOLD/COMPLETED→ARCHIVED, terminal ARCHIVED) enforced server-side in `project-status.ts`; writes `AuditLog` entries on create and status change, advancing Phase 4 Module 5's "wire audit writes into every governed mutation"
  - [x] Subtask 5.1.2: UI layer
    - [x] Activity: Portfolio dashboard listing all projects with status/health (`apps/web/src/app/dashboard/projects`) — health is currently derived from status via a colored Tag/inline Select restricted to valid transitions; a richer health-scoring signal is a Phase 6/7 concern

### Module 6: Governance Workflow
- [ ] Task 6.1: Implement the governance workflow engine (per Phase 2 design)
  - [ ] Subtask 6.1.1: API layer
    - [ ] Activity: Workflow state machine service
  - [ ] Subtask 6.1.2: UI layer
    - [ ] Activity: Workflow status stepper component

### Module 7: Document Management
- [ ] Task 7.1: Build document upload/versioning
  - [ ] Subtask 7.1.1: API layer
    - [ ] Activity: `DocumentModule` with S3-compatible storage integration
  - [ ] Subtask 7.1.2: UI layer
    - [ ] Activity: Document list + version history screen

### Module 8: SOP Library
- [ ] Task 8.1: Build the standard operating procedure library
  - [ ] Subtask 8.1.1: API layer
    - [ ] Activity: `SopModule` CRUD with categorization
  - [ ] Subtask 8.1.2: UI layer
    - [ ] Activity: SOP library browser screen

### Module 9: Checklist Engine
- [ ] Task 9.1: Build the configurable checklist engine
  - [ ] Subtask 9.1.1: API layer
    - [ ] Activity: `ChecklistModule` with templated + per-project checklists
  - [ ] Subtask 9.1.2: UI layer
    - [ ] Activity: Interactive checklist component with progress tracking

## Deliverables Checklist
- [ ] Module Specifications
- [ ] Business Rules
- [ ] Screen Specifications
