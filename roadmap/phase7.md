# Phase 7 — Intelligence Platform

**Status:** In Progress
**Deliverables:** AI Architecture, Prompt Library, Knowledge Graph Design

## Modules

### Module 1: AI Copilot
- [ ] Task 1.1: Build the in-app AI copilot
  - [ ] Subtask 1.1.1: Design the copilot architecture (model provider, context assembly)
    - [ ] Activity: Choose model provider and integration pattern
    - [ ] Activity: Prototype a copilot chat panel in the workspace UI

### Module 2: Requirement Analyzer
- [ ] Task 2.1: Build AI-assisted requirement analysis
  - [ ] Subtask 2.1.1: Prompt design for gap/ambiguity detection
    - [ ] Activity: Draft prompts that flag ambiguous or missing requirements

### Module 3: AI Audit Assistant
- [ ] Task 3.1: Build an AI assistant over the audit trail
  - [ ] Subtask 3.1.1: Summarize audit history on demand
    - [ ] Activity: Prototype "explain this project's audit trail" prompt + retrieval

### Module 4: AI Risk Prediction
- [ ] Task 4.1: Build predictive risk scoring
  - [ ] Subtask 4.1.1: Define risk signal inputs
    - [ ] Activity: Identify signals (overdue tasks, missing sign-offs, churn) feeding a risk score

### Module 5: Meeting Summarization
- [ ] Task 5.1: Build meeting summarization for governance reviews
  - [ ] Subtask 5.1.1: Integrate transcript ingestion + summarization
    - [ ] Activity: Prototype summarizing an uploaded review transcript into a Decision Log entry

### Module 6: Knowledge Repository
- [ ] Task 6.1: Build the organizational knowledge repository
  - [ ] Subtask 6.1.1: Design knowledge ingestion pipeline
    - [ ] Activity: Draft ingestion pipeline for SOPs, decisions, and past audits — not built; deliberately deferred, the MVP below is manual entry, not an automated pipeline
  - [x] Subtask 6.1.2: API + UI layer
    - [x] Activity: `KnowledgeArticleModule` (`apps/api/src/knowledge-articles`) — org-level, not project-scoped, free-text `category` + `tags: String[]`, `ADMIN`/`GOVERNANCE_LEAD` write, audit-logged (`KNOWLEDGE_ARTICLE_CREATED`, `KNOWLEDGE_ARTICLE_UPDATED`); browser screen (`apps/web/src/app/dashboard/knowledge`) with tag chips and expandable content, new sidebar nav entry

### Module 7: Enterprise Search
- [ ] Task 7.1: Build cross-module enterprise search (builds on Phase 4 search architecture)
  - [ ] Subtask 7.1.1: Add semantic search on top of full-text search
    - [ ] Activity: Prototype embeddings-backed search over documents/decisions — not built; deliberately deferred, needs a real vector/embeddings infra decision
  - [x] Subtask 7.1.2: Keyword search MVP
    - [x] Activity: `SearchModule` (`apps/api/src/search`) — aggregates a case-insensitive `contains` query across every text-bearing register (Risk, Issue, Decision, Change Request, Requirement, Review, Document, SOP, Knowledge Article, Department, Customer Sign-off), org-scoped, capped per type; `apps/web/src/app/dashboard/search` UI with results linking back into the owning project

### Module 8: Analytics
- [ ] Task 8.1: Build the analytics module
  - [ ] Subtask 8.1.1: Define core analytics dashboards
    - [ ] Activity: Design governance health, audit-readiness, and adoption dashboards

## Deliverables Checklist
- [ ] AI Architecture
- [ ] Prompt Library
- [ ] Knowledge Graph Design
