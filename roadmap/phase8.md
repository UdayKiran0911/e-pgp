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
- [x] Task 2.1: Build the notification system
  - [x] Subtask 2.1.1: In-app notifications
    - [x] Activity: `NotificationModule` with read/unread state (`apps/api/src/notifications`) — system-generated only (no public create endpoint), recipient-scoped list/mark-read/mark-all-read; bell icon with unread-count `Badge` in the dashboard sidebar's Account row
  - [x] Subtask 2.1.2: Delivery channels
    - [x] Activity: Email + in-app delivery abstraction — `GovernanceNotifierService` (`apps/api/src/governance-notifier`), extracted from the inline 3-channel (notification/webhook/email) fan-out first built for Deployment Governance decisions (Phase 6 Module 12); now also wired into Change Request decisions (Phase 6 Module 7). Every other governed mutation across the platform still only writes an `AuditLog` entry — wiring the shared notifier into the rest of the mutation surface (Reviews, Governance Gates, Customer Sign-off) is a separate follow-up, but the reusable piece now exists

### Module 3: Email Engine
- [ ] Task 3.1: Build the transactional email engine
  - [ ] Subtask 3.1.1: Template system + provider integration
    - [x] Activity: In-app email outbox — `EmailModule` (`apps/api/src/email`), `send()` writes an `EmailLog` row (recipient, subject, body) rather than dispatching over SMTP/a provider API; wired as a 4th notification channel into Deployment Governance decisions alongside audit log, in-app notification, and webhook (Phase 6 Module 12); read-only `apps/web/src/app/dashboard/email-logs` UI with a disclaimer that mail is logged, not sent
    - [ ] Activity: Integrate a real transactional email provider (SMTP/SES/SendGrid/etc.) — not built; deliberately deferred, needs a real provider/credential decision
    - [ ] Activity: Build templates for sign-off requests and governance alerts — subject/body are currently inline strings at the call site, no template system yet

### Module 4: Teams/Slack Integration
- [x] Task 4.1: Build Teams/Slack notification connectors
  - [x] Subtask 4.1.1: Webhook-based integration
    - [x] Activity: Slack incoming webhook connector — `WebhookConnectorModule` (`apps/api/src/webhook-connectors`), `provider: SLACK`, the org pastes a Slack-generated incoming-webhook URL (no OAuth app registration needed on our side); `ADMIN`-only CRUD, `apps/web/src/app/dashboard/webhooks` UI
    - [x] Activity: Teams incoming webhook connector — same `WebhookConnectorModule`, `provider: TEAMS`; the URL is AES-256-GCM-encrypted at rest (see Phase 9 Module 5) and never returned by the API once set; wired as the first real producer into Deployment Governance decisions (Phase 6 Module 12)

### Module 5: Jira Integration
- [ ] Task 5.1: Build Jira sync connector
  - [ ] Subtask 5.1.1: Two-way issue sync
    - [x] Activity: Prototype Jira issue <-> Issue Register sync — link-based, not sync: `ExternalReferenceModule` (`apps/api/src/external-references`, shared with Modules 6/7/8 via a `provider` discriminator, same trick as `Review`/`GovernanceGate`), the org pastes a Jira issue key + URL against an Issue Register entry. A real two-way sync needs Jira OAuth/PAT credentials and webhook handling, deliberately not built here

### Module 6: Azure DevOps Integration
- [ ] Task 6.1: Build Azure DevOps connector
  - [ ] Subtask 6.1.1: Work item + pipeline status sync
    - [x] Activity: Prototype ADO work item sync — same link-based `ExternalReference` (`provider: AZURE_DEVOPS`) as Module 5; no real work-item/pipeline sync

### Module 7: SharePoint Integration
- [ ] Task 7.1: Build SharePoint document connector
  - [ ] Subtask 7.1.1: Document library sync
    - [x] Activity: Prototype SharePoint document import into Document Management — same link-based `ExternalReference` (`provider: SHAREPOINT`); attached to Issues like the others rather than a Document Management library-sync, since the shared model is issue-scoped — a document-library-specific import remains unbuilt

### Module 8: ServiceNow Integration
- [ ] Task 8.1: Build ServiceNow connector
  - [ ] Subtask 8.1.1: Change/incident sync
    - [x] Activity: Prototype ServiceNow change request sync — same link-based `ExternalReference` (`provider: SERVICENOW`); no real incident/change sync

### Module 9: SDK
- [x] Task 9.1: Publish a platform SDK
  - [x] Subtask 9.1.1: Generate a typed client from the OpenAPI spec
    - [x] Activity: Publish the OpenAPI spec itself — `@nestjs/swagger` wired in `apps/api/src/main.ts`, `GET /api-docs` (Swagger UI) and `GET /api-docs-json` (raw spec), also closing Phase 4's "OpenAPI Specification" deliverable
    - [x] Activity: Publish `@epg/sdk` generated from the spec — `packages/sdk`, `openapi-typescript` generates fully-typed `paths` from a snapshot of the spec (`apps/api export:openapi` → `openapi.json`), a thin `createEpgClient()` wrapper (`openapi-fetch`) gives every route/method/request/response real types with zero hand-written per-endpoint methods; publishing to a package registry remains deliberately deferred — consumed as a workspace dependency for now

### Module 10: Plugin Framework
- [x] Task 10.1: Build an extension/plugin framework
  - [x] Subtask 10.1.1: Define plugin manifest + lifecycle hooks
    - [x] Activity: Draft plugin manifest schema and a sample plugin — `PluginModule` (`apps/api/src/plugins`), org-level manifest registry (`name`, `version`, `description`, free-form `manifest: Json`, `isEnabled` toggle), `ADMIN`-only write, audit-logged (`PLUGIN_REGISTERED`, `PLUGIN_TOGGLED`); `apps/web/src/app/dashboard/plugins` UI. A real execution sandbox/lifecycle-hook runtime that actually invokes plugin code is not built — this is metadata storage only

## Deliverables Checklist
- [ ] Integration Specifications
- [ ] API Connectors
- [ ] Extension Framework
