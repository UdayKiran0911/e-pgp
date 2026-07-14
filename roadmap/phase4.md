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
- [ ] Task 2.1: Produce ER diagrams from the schema
  - [ ] Subtask 2.1.1: Generate/maintain ER diagrams
    - [ ] Activity: Export an ER diagram from `prisma/schema.prisma`
    - [ ] Activity: Keep diagram in sync each time the schema changes

### Module 3: API Design
- [ ] Task 3.1: Design the REST API surface
  - [ ] Subtask 3.1.1: Define resource-oriented routes per module
    - [ ] Activity: Draft OpenAPI spec for Organization/User/Project resources
  - [ ] Subtask 3.1.2: Adopt NestJS OpenAPI (Swagger) generation
    - [ ] Activity: Add `@nestjs/swagger` and decorate controllers/DTOs

### Module 4: Search Architecture
- [ ] Task 4.1: Design enterprise search (feeds Phase 7)
  - [ ] Subtask 4.1.1: Choose a search approach (Postgres full-text vs. dedicated engine)
    - [ ] Activity: Prototype full-text search over Project/Document tables

### Module 5: Audit Model
- [x] Task 5.1: Design the append-only audit trail
  - [x] Subtask 5.1.1: Model `AuditLog` as append-only
    - [x] Activity: Add `AuditLog` model tied to `Project`
  - [ ] Subtask 5.1.2: Wire audit writes into every governed mutation
    - [ ] Activity: Add an interceptor/service that writes an `AuditLog` row on governed actions

### Module 6: Versioning
- [ ] Task 6.1: Design entity-level versioning for governed documents
  - [ ] Subtask 6.1.1: Decide versioning strategy (append-only history table vs. row versioning)
    - [ ] Activity: Prototype versioning for the Document Management module

### Module 7: Metadata Design
- [ ] Task 7.1: Design flexible metadata storage
  - [ ] Subtask 7.1.1: Decide on JSON columns vs. EAV pattern for custom fields
    - [ ] Activity: Add a `metadata Json?` convention for extensible entities

## Deliverables Checklist
- [ ] ER Diagrams
- [ ] Database Dictionary
- [ ] OpenAPI Specification
- [ ] API Documentation
