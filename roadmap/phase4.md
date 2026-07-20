# Phase 4 — Data & API Design

**Status:** In Progress
**Deliverables:** ER Diagrams, Database Dictionary, OpenAPI Specification, API Documentation

## Modules

### Module 1: Database Schema
- [x] Task 1.1: Stand up the initial Prisma schema
  - [x] Subtask 1.1.1: Define core entities
    - [x] Activity: Model `Organization`, `User`, `Project`, `AuditLog`
    - [x] Activity: Configure PostgreSQL datasource via `@prisma/adapter-pg`
  - [ ] Subtask 1.1.2: Extend schema for governance modules
    - [ ] Activity: Model Risk Register, Decision Log, Issue Register (Phase 6)
    - [ ] Activity: Model Document Management, SOP Library, Checklist Engine (Phase 5)

### Module 2: Entity Relationship Model
- [x] Task 2.1: Produce ER diagrams from the schema
  - [x] Subtask 2.1.1: Generate/maintain ER diagrams
    - [x] Activity: Export an ER diagram from `prisma/schema.prisma` — `scripts/generate-er-diagram.js` (`pnpm generate:er-diagram`), regex-parses the schema (same no-build-step approach as `scripts/ui-audit.js`/`scripts/contrast-audit.js`) into a Mermaid `erDiagram`, written to `docs/ER_DIAGRAM.md`
    - [x] Activity: Keep diagram in sync each time the schema changes — not automated/enforced in CI; a documented manual re-run step (same honest limitation as the SDK's `openapi.json` snapshot, Phase 8 Module 9)

### Module 3: API Design
- [x] Task 3.1: Design the REST API surface
  - [x] Subtask 3.1.1: Define resource-oriented routes per module
    - [x] Activity: Draft OpenAPI spec for Organization/User/Project resources — superseded by auto-generation (Subtask 3.1.2) covering every resource in the platform, not just these three, so no separate hand-drafted spec was written
  - [x] Subtask 3.1.2: Adopt NestJS OpenAPI (Swagger) generation
    - [x] Activity: Add `@nestjs/swagger` and decorate controllers/DTOs — `SwaggerModule` wired in `apps/api/src/main.ts` (`GET /api-docs` UI, `GET /api-docs-json` spec, see Phase 8 Module 9); the spec is inferred from existing controller routes and class-validator DTOs rather than explicit `@ApiProperty`/`@ApiOperation` decoration on every field — good enough for a browsable/consumable spec, richer per-field documentation is a follow-up

### Module 4: Search Architecture
- [ ] Task 4.1: Design enterprise search (feeds Phase 7)
  - [ ] Subtask 4.1.1: Choose a search approach (Postgres full-text vs. dedicated engine)
    - [ ] Activity: Prototype full-text search over Project/Document tables

### Module 5: Audit Model
- [x] Task 5.1: Design the append-only audit trail
  - [x] Subtask 5.1.1: Model `AuditLog` as append-only
    - [x] Activity: Add `AuditLog` model tied to `Project`
    - [x] Activity: Re-scope `AuditLog` to the `Organization` (required) with an optional `Project` reference, so org-wide actions (not just project actions) have somewhere to attach — migrated live data via a backfill step (`prisma/migrations/20260717000000_auditlog_organization_scope`)
  - [x] Subtask 5.1.2: Wire audit writes into every governed mutation
    - [x] Activity: Extracted a shared `AuditLogService` (`apps/api/src/audit`) once the inline `prisma.auditLog.create` pattern repeated a third time — every governed mutation now writes through it, never Prisma directly
    - [x] Activity: Project create + status-change (`PROJECT_CREATED`, `PROJECT_STATUS_CHANGED`), User role change + activate/deactivate (`USER_ROLE_CHANGED`, `USER_DEACTIVATED`, `USER_REACTIVATED`), and Organization rename (`ORGANIZATION_UPDATED`) all write audit entries — verified end-to-end against a real database in integration tests

### Module 6: Versioning
- [x] Task 6.1: Design entity-level versioning for governed documents
  - [x] Subtask 6.1.1: Decide versioning strategy (append-only history table vs. row versioning)
    - [x] Activity: Prototype versioning for the Document Management module — chose append-only history table (`DocumentVersion`, `apps/api/src/documents`): the `Document` row always holds current state, the prior url/storageKey/version is snapshotted into `DocumentVersion` before every content-changing update or re-upload — same shape as `AuditLog`'s relationship to the entities it logs

### Module 7: Metadata Design
- [x] Task 7.1: Design flexible metadata storage
  - [x] Subtask 7.1.1: Decide on JSON columns vs. EAV pattern for custom fields
    - [x] Activity: Add a `metadata Json?` convention for extensible entities — landed on `Project` first (`apps/api/src/projects`), a `Record<string, string>` the org defines freely, no per-key validation; a "Custom Fields" editor on the project detail page. Not yet extended to other entities — proving useful on one register before generalizing.

## Deliverables Checklist
- [x] ER Diagrams — `docs/ER_DIAGRAM.md`, generated (see Module 2); a snapshot, not continuously synced
- [ ] Database Dictionary
- [x] OpenAPI Specification — live-generated, not a static document: `GET /api-docs-json` off the running API (see Module 3)
- [ ] API Documentation
