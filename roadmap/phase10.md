# Phase 10 — Engineering & DevOps

**Status:** In Progress
**Deliverables:** DevOps Handbook, Deployment Guide, Operational Runbook

## Modules

### Module 1: Coding Standards
- [x] Task 1.1: Establish shared linting/formatting/tsconfig standards
  - [x] Subtask 1.1.1: Shared packages
    - [x] Activity: `packages/eslint-config`, `packages/tsconfig`
  - [ ] Subtask 1.1.2: Contribution guide
    - [ ] Activity: Document coding standards and PR review checklist

### Module 2: CI/CD
- [x] Task 2.1: Stand up CI pipeline
  - [x] Subtask 2.1.1: GitHub Actions workflow
    - [x] Activity: Lint + typecheck + unit + integration on every PR
    - [ ] Activity: Add e2e job and deployment job
- [ ] Task 2.2: Stand up CD pipeline
  - [ ] Subtask 2.2.1: Automated deploy on merge to main
    - [ ] Activity: Wire container build + push + deploy steps

### Module 3: Docker
- [x] Task 3.1: Containerize both apps
  - [x] Subtask 3.1.1: Dockerfiles
    - [x] Activity: `apps/web/Dockerfile`, `apps/api/Dockerfile`
  - [x] Subtask 3.1.2: Local orchestration
    - [x] Activity: `docker-compose.yml` for web + api + postgres

### Module 4: Kubernetes
- [ ] Task 4.1: Author Kubernetes manifests/Helm chart
  - [ ] Subtask 4.1.1: Base manifests
    - [ ] Activity: Deployment/Service/Ingress manifests for web and api
  - [ ] Subtask 4.1.2: Environment overlays
    - [ ] Activity: Kustomize or Helm values per environment

### Module 5: Infrastructure as Code
- [ ] Task 5.1: Define infrastructure as code
  - [ ] Subtask 5.1.1: Choose IaC tool (Terraform/Pulumi)
    - [ ] Activity: Provision Postgres, container registry, and cluster via IaC

### Module 6: Monitoring
- [ ] Task 6.1: Add observability
  - [ ] Subtask 6.1.1: Metrics
    - [ ] Activity: Expose Prometheus metrics from the API
  - [ ] Subtask 6.1.2: Dashboards/alerts
    - [ ] Activity: Build Grafana dashboards and alert rules

### Module 7: Logging
- [ ] Task 7.1: Add structured logging
  - [ ] Subtask 7.1.1: Structured log format
    - [ ] Activity: Add a structured logger (pino) to the NestJS API
  - [ ] Subtask 7.1.2: Centralized log aggregation
    - [ ] Activity: Ship logs to a centralized log store

### Module 8: Performance Testing
- [ ] Task 8.1: Add load/performance testing
  - [ ] Subtask 8.1.1: Load test critical endpoints
    - [ ] Activity: Add k6/Artillery scripts for governance workflow endpoints

### Module 9: Release Management
- [x] Task 9.1: Establish versioning and changelog process
  - [x] Subtask 9.1.1: Versioning
    - [x] Activity: `versions.md`
  - [x] Subtask 9.1.2: Changelog
    - [x] Activity: `changelog.md` + `release-cut` skill

## Deliverables Checklist
- [ ] DevOps Handbook
- [ ] Deployment Guide
- [ ] Operational Runbook
