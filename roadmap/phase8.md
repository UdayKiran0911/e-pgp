# Phase 8 — Platform Engineering

**Status:** In Progress
**Deliverables:** Integration Specifications, API Connectors, Extension Framework

## Modules

### Module 1: Authentication
- [ ] Task 1.1: Build production authentication
  - [x] Subtask 1.1.1: Implement JWT-based auth in NestJS
    - [x] Activity: `AuthModule` with register/login/`GET /auth/me` (`apps/api/src/auth`) — registration creates an Organization + its first ADMIN user
    - [x] Activity: Password hashing (bcryptjs, 12 salt rounds) + `isActive` flag for deactivation; explicit logout/refresh endpoints not yet needed (short-lived 8h JWT, no refresh-token rotation yet)
  - [ ] Subtask 1.1.2: Add SSO support
    - [ ] Activity: Integrate SAML/OIDC for enterprise SSO
- [x] Task 1.2: Web auth UI
  - [x] Subtask 1.2.1: Login/register pages
    - [x] Activity: `/login` and `/register` pages (`apps/web/src/app/login`, `.../register`)
    - [x] Activity: `AuthProvider` context (token persisted in localStorage — move to httpOnly cookie in Phase 9 hardening) + `RequireAuth` route guard

### Module 2: Notifications
- [ ] Task 2.1: Build the notification system
  - [ ] Subtask 2.1.1: In-app notifications
    - [ ] Activity: `NotificationModule` with read/unread state
  - [ ] Subtask 2.1.2: Delivery channels
    - [ ] Activity: Email + in-app delivery abstraction

### Module 3: Email Engine
- [ ] Task 3.1: Build the transactional email engine
  - [ ] Subtask 3.1.1: Template system + provider integration
    - [ ] Activity: Integrate a transactional email provider
    - [ ] Activity: Build templates for sign-off requests and governance alerts

### Module 4: Teams/Slack Integration
- [ ] Task 4.1: Build Teams/Slack notification connectors
  - [ ] Subtask 4.1.1: Webhook-based integration
    - [ ] Activity: Slack incoming webhook connector
    - [ ] Activity: Teams incoming webhook connector

### Module 5: Jira Integration
- [ ] Task 5.1: Build Jira sync connector
  - [ ] Subtask 5.1.1: Two-way issue sync
    - [ ] Activity: Prototype Jira issue <-> Issue Register sync

### Module 6: Azure DevOps Integration
- [ ] Task 6.1: Build Azure DevOps connector
  - [ ] Subtask 6.1.1: Work item + pipeline status sync
    - [ ] Activity: Prototype ADO work item sync

### Module 7: SharePoint Integration
- [ ] Task 7.1: Build SharePoint document connector
  - [ ] Subtask 7.1.1: Document library sync
    - [ ] Activity: Prototype SharePoint document import into Document Management

### Module 8: ServiceNow Integration
- [ ] Task 8.1: Build ServiceNow connector
  - [ ] Subtask 8.1.1: Change/incident sync
    - [ ] Activity: Prototype ServiceNow change request sync

### Module 9: SDK
- [ ] Task 9.1: Publish a platform SDK
  - [ ] Subtask 9.1.1: Generate a typed client from the OpenAPI spec
    - [ ] Activity: Publish `@epg/sdk` generated from Phase 4's OpenAPI spec

### Module 10: Plugin Framework
- [ ] Task 10.1: Build an extension/plugin framework
  - [ ] Subtask 10.1.1: Define plugin manifest + lifecycle hooks
    - [ ] Activity: Draft plugin manifest schema and a sample plugin

## Deliverables Checklist
- [ ] Integration Specifications
- [ ] API Connectors
- [ ] Extension Framework
