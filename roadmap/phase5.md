# Phase 5 — Core Platform Modules

**Status:** Not Started
**Deliverables:** Module Specifications, Business Rules, Screen Specifications

## Modules

### Module 1: Organization Management
- [ ] Task 1.1: Build organization CRUD
  - [ ] Subtask 1.1.1: API layer
    - [ ] Activity: NestJS `OrganizationModule` (controller, service, DTOs)
    - [ ] Activity: Unit + integration tests for organization CRUD
  - [ ] Subtask 1.1.2: UI layer
    - [ ] Activity: Organization settings screen (AntD Form + Table)
    - [ ] Activity: Unit tests for the organization UI

### Module 2: Department Management
- [ ] Task 2.1: Build department hierarchy under an organization
  - [ ] Subtask 2.1.1: API layer
    - [ ] Activity: `DepartmentModule` with parent/child relationships
  - [ ] Subtask 2.1.2: UI layer
    - [ ] Activity: Department tree view screen

### Module 3: User Management
- [ ] Task 3.1: Build user CRUD and profile management
  - [ ] Subtask 3.1.1: API layer
    - [ ] Activity: `UserModule` (invite, deactivate, update role)
  - [ ] Subtask 3.1.2: UI layer
    - [ ] Activity: User management table with role badges

### Module 4: RBAC
- [ ] Task 4.1: Implement role-based access control
  - [ ] Subtask 4.1.1: Define roles/permissions model
    - [ ] Activity: Map `Role` enum (`ADMIN`, `GOVERNANCE_LEAD`, `MEMBER`, `AUDITOR`) to permissions
  - [ ] Subtask 4.1.2: Enforce RBAC in API and UI
    - [ ] Activity: NestJS guard for role-based route protection
    - [ ] Activity: Conditional UI rendering based on role

### Module 5: Project Portfolio
- [ ] Task 5.1: Build the project portfolio view
  - [ ] Subtask 5.1.1: API layer
    - [ ] Activity: `ProjectModule` CRUD with status transitions
  - [ ] Subtask 5.1.2: UI layer
    - [ ] Activity: Portfolio dashboard listing all projects with status/health

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
