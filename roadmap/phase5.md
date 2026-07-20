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
    - [x] Activity: Dedicated organization settings/edit screen (`apps/web/src/app/dashboard/settings`) — `ADMIN`-only rename via `PATCH /organizations/me`, linked from the sidebar's Account gear popover

### Module 2: Department Management
- [x] Task 2.1: Build department hierarchy under an organization
  - [x] Subtask 2.1.1: API layer
    - [x] Activity: `DepartmentModule` with parent/child relationships (`apps/api/src/departments`) — org-level (not project-scoped), self-referential `parentId`, cycle prevention on reparenting, `ADMIN`-only write (mirrors Users), audit-logged (`DEPARTMENT_CREATED`, `DEPARTMENT_UPDATED`)
  - [x] Subtask 2.1.2: UI layer
    - [x] Activity: Department tree view screen (`apps/web/src/app/dashboard/departments`) — antd `Tree` built client-side from the flat list

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
- [x] Task 6.1: Implement the governance workflow engine (per Phase 2 design)
  - [x] Subtask 6.1.1: API layer
    - [x] Activity: Workflow state machine service (`apps/api/src/projects/governance-stage.ts`) — a `governanceStage` field on `Project` (INITIATION → PLANNING → EXECUTION → MONITORING → CLOSURE), strictly sequential and independent of `status` (health vs. governance progress are separate concerns); enforced in `ProjectsService.update`, `ADMIN`/`GOVERNANCE_LEAD` only, writes a `GOVERNANCE_STAGE_ADVANCED` audit log entry
  - [x] Subtask 6.1.2: UI layer
    - [x] Activity: Workflow status stepper component (`apps/web/src/app/dashboard/projects`) — antd `Steps` per project, click-to-advance restricted to the one valid next stage, read-only for non-managers

### Module 7: Document Management
- [ ] Task 7.1: Build document upload/versioning
  - [x] Subtask 7.1.1: API layer
    - [x] Activity: `DocumentModule`, simplified: link-based register (title + external URL + a version label) rather than native upload (`apps/api/src/documents`) — `ADMIN`/`GOVERNANCE_LEAD` write, audit-logged (`DOCUMENT_ADDED`, `DOCUMENT_UPDATED`)
    - [x] Activity: Native file upload/download — `StorageProvider` interface (`apps/api/src/storage/storage.types.ts`) with a day-1 `LocalDiskStorageService` implementation; `POST /documents/upload` (multipart) and `GET /documents/:id/download`, audit-logged (`DOCUMENT_UPLOADED`); S3-compatible swap deliberately deferred — needs a real bucket/provider decision, but the interface is already shaped for it
  - [x] Subtask 7.1.2: UI layer
    - [x] Activity: Document list screen — a tab on the project detail page (`apps/web/src/app/dashboard/projects/[id]`), title links out to the external URL or the uploaded-file download endpoint depending on `storageKey`
    - [x] Activity: Upload flow — "Upload File" action on the Documents tab (`antd` `Upload` with manual submit), stores the file via `LocalDiskStorageService`
    - [ ] Activity: Version history screen — only a single current `version` label is tracked, no history of prior versions

### Module 8: SOP Library
- [x] Task 8.1: Build the standard operating procedure library
  - [x] Subtask 8.1.1: API layer
    - [x] Activity: `SopModule` CRUD with categorization (`apps/api/src/sops`) — org-level (not project-scoped), free-text `category`, `ADMIN`/`GOVERNANCE_LEAD` write, audit-logged (`SOP_CREATED`, `SOP_UPDATED`)
  - [x] Subtask 8.1.2: UI layer
    - [x] Activity: SOP library browser screen (`apps/web/src/app/dashboard/sops`) — table with category tags and expandable content preview

### Module 9: Checklist Engine
- [x] Task 9.1: Build the configurable checklist engine
  - [x] Subtask 9.1.1: API layer
    - [x] Activity: `ChecklistModule` with per-project checklists (`apps/api/src/checklist`) — simple title + `isDone` toggle, `ADMIN`/`GOVERNANCE_LEAD` write, audit-logged (`CHECKLIST_ITEM_ADDED`, `CHECKLIST_ITEM_TOGGLED`)
    - [x] Activity: Templated checklists (reusable templates applied to new projects) — `ChecklistTemplateModule` (`apps/api/src/checklist-templates`), org-level named templates with ordered items, `POST /checklist-templates/:id/apply` snapshot-copies the template's items onto a project's checklist, audit-logged (`CHECKLIST_TEMPLATE_APPLIED`)
  - [x] Subtask 9.1.2: UI layer
    - [x] Activity: Interactive checklist component (`apps/web/src/app/dashboard/projects/[id]`) — a tab with a `Checkbox` list; progress tracking (e.g. "3/8 done") not yet surfaced
    - [x] Activity: Checklist template management screen (`apps/web/src/app/dashboard/checklist-templates`) — CRUD for org-level templates; "Apply Template" action on the project Checklist tab

## Deliverables Checklist
- [ ] Module Specifications
- [ ] Business Rules
- [ ] Screen Specifications
