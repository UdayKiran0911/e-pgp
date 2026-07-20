# Phase 9 — Security & Compliance

**Status:** In Progress
**Deliverables:** Compliance Framework, Security Documentation, Audit Reports

## Modules

### Module 1: ISO 9001
- [ ] Task 1.1: Map quality management processes to ISO 9001
  - [ ] Subtask 1.1.1: Gap analysis
    - [ ] Activity: Document current process vs. ISO 9001 requirements

### Module 2: ISO 27001
- [ ] Task 2.1: Build the information security management system (ISMS)
  - [ ] Subtask 2.1.1: Control mapping
    - [ ] Activity: Map platform features to ISO 27001 Annex A controls

### Module 3: SOC2
- [ ] Task 3.1: Prepare for SOC2 Type I/II
  - [ ] Subtask 3.1.1: Trust Services Criteria mapping
    - [ ] Activity: Map security/availability/confidentiality criteria to controls

### Module 4: CMMI
- [ ] Task 4.1: Align delivery governance with CMMI practices
  - [ ] Subtask 4.1.1: Process area mapping
    - [ ] Activity: Map governance workflow module to relevant CMMI process areas

### Module 5: Encryption
- [ ] Task 5.1: Implement encryption at rest and in transit
  - [ ] Subtask 5.1.1: Data-at-rest encryption
    - [ ] Activity: Enable Postgres encryption at rest in deployment config — not built; the database itself (Neon) encrypts at rest at the provider level, but that's infra configuration, not application code
    - [x] Activity: Application-level field encryption — `EncryptionService` (`apps/api/src/encryption`), AES-256-GCM keyed by `ENCRYPTION_KEY`, used so far for `WebhookConnector.encryptedUrl` (Phase 8 Module 4); unit-tested for round-trip, tamper-detection (auth tag), and cross-key isolation
  - [ ] Subtask 5.1.2: Data-in-transit encryption
    - [ ] Activity: Enforce TLS across all service-to-service traffic — not built; the API↔Neon connection already requires `sslmode=require`, but no broader service-mesh/TLS-everywhere policy exists yet

### Module 6: Audit Logging
- [x] Task 6.1: Foundational append-only audit logging
  - [x] Subtask 6.1.1: `AuditLog` Prisma model
    - [x] Activity: Add append-only `AuditLog` model with actor/action/metadata
  - [ ] Subtask 6.1.2: Tamper-evidence
    - [ ] Activity: Add hash-chaining or write-once storage for audit log integrity

### Module 7: Backup & Recovery
- [ ] Task 7.1: Define backup and recovery procedures
  - [ ] Subtask 7.1.1: Automated backups
    - [ ] Activity: Configure scheduled Postgres backups with retention policy — not built; deliberately deferred, needs a real infra decision (provider, schedule, retention, restore tooling)
  - [x] Subtask 7.1.2: On-demand export MVP
    - [x] Activity: `OrganizationsService.exportData()` — an `ADMIN`-only JSON snapshot of the org's core data (projects, users minus `passwordHash`, and every register), `GET /organizations/me/export`, audit-logged (`ORGANIZATION_DATA_EXPORTED`); download button on the Organization Settings page. Manual and on-demand, not a scheduled backup/restore pipeline

### Module 8: Disaster Recovery
- [ ] Task 8.1: Define disaster recovery plan
  - [ ] Subtask 8.1.1: RTO/RPO targets
    - [ ] Activity: Document RTO/RPO and failover procedure

### Module 9: Vulnerability Management
- [ ] Task 9.1: Implement vulnerability scanning
  - [ ] Subtask 9.1.1: Dependency and container scanning
    - [ ] Activity: Add `pnpm audit` / Dependabot to CI — not built; deliberately deferred, a CI-pipeline change rather than an app module
    - [ ] Activity: Add container image scanning to the CI pipeline — not built, same reason
  - [x] Subtask 9.1.2: Findings register
    - [x] Activity: `SecurityFindingModule` (`apps/api/src/security-findings`) — project-scoped, same CRUD+severity+status shape as Risk/Issue (`severity`: LOW-CRITICAL, `status`: OPEN → IN_REMEDIATION/ACCEPTED_RISK → RESOLVED), `ADMIN`/`GOVERNANCE_LEAD` write, audit-logged; a tab on the project detail page. Tracks findings however they're discovered (manual review, external scan, pen test) — it isn't itself a scanner, and doesn't yet feed the automated CI scanning above

## Deliverables Checklist
- [ ] Compliance Framework
- [ ] Security Documentation
- [ ] Audit Reports
