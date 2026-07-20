# Phase 10 — Engineering & DevOps

**Status:** In Progress
**Deliverables:** DevOps Handbook, Deployment Guide, Operational Runbook

## Modules

### Module 1: Coding Standards
- [x] Task 1.1: Establish shared linting/formatting/tsconfig standards
  - [x] Subtask 1.1.1: Shared packages
    - [x] Activity: `packages/eslint-config`, `packages/tsconfig`
  - [x] Subtask 1.1.2: Contribution guide
    - [x] Activity: Document coding standards and PR review checklist — `CONTRIBUTING.md` (org-scoping/RBAC/audit-logging conventions, test-with-code rule, PR checklist, a "Scope discipline" section pointing at `apps/api/src/storage` and `apps/api/src/email` as worked examples of shipping honest simplifications instead of guessing at infra decisions)

### Module 2: CI/CD
- [x] Task 2.1: Stand up CI pipeline
  - [x] Subtask 2.1.1: GitHub Actions workflow
    - [x] Activity: Lint + typecheck + unit + integration on every PR
    - [x] Activity: Add e2e job and deployment job — the e2e job (Playwright, `apps/web/e2e`) already existed in `.github/workflows/ci.yml`; this checkbox had simply never been updated to reflect it
- [ ] Task 2.2: Stand up CD pipeline
  - [x] Subtask 2.2.1: Automated deploy on merge to main
    - [x] Activity: Wire container build + push steps — new `publish` job in `.github/workflows/ci.yml`, triggered on push to `main`, builds and pushes `apps/web`/`apps/api` images to GHCR using the built-in `GITHUB_TOKEN` (no external registry credentials needed)
    - [ ] Activity: Wire an actual deploy step (apply to a running cluster) — not built; deliberately deferred, needs a real cluster/environment decision (see Module 4)

### Module 3: Docker
- [x] Task 3.1: Containerize both apps
  - [x] Subtask 3.1.1: Dockerfiles
    - [x] Activity: `apps/web/Dockerfile`, `apps/api/Dockerfile`
  - [x] Subtask 3.1.2: Local orchestration
    - [x] Activity: `docker-compose.yml` for web + api + postgres

### Module 4: Kubernetes
- [x] Task 4.1: Author Kubernetes manifests/Helm chart
  - [x] Subtask 4.1.1: Base manifests
    - [x] Activity: Deployment/Service/Ingress manifests for web and api — `k8s/base/` (Kustomize): namespace, configmap, `secret.example.yaml` template (real `secret.yaml` gitignored), api/web Deployments with `/health` probes, api/web Services, nginx Ingress; `k8s/README.md` documents what's built vs. deferred, including that `LocalDiskStorageService` uploads aren't shared across API replicas
  - [x] Subtask 4.1.2: Environment overlays
    - [x] Activity: Kustomize or Helm values per environment — `k8s/overlays/{dev,staging,prod}`, each layering on `k8s/base/` with a name prefix + dedicated namespace; `dev` also patches replica counts down to 1 and lowers resource requests, `staging`/`prod` set `NODE_ENV` per environment. Real per-environment image tags remain deliberately deferred (no registry/org decision made) — Helm as an alternative to Kustomize was not built

### Module 5: Infrastructure as Code
- [ ] Task 5.1: Define infrastructure as code
  - [ ] Subtask 5.1.1: Choose IaC tool (Terraform/Pulumi)
    - [ ] Activity: Provision Postgres, container registry, and cluster via IaC

### Module 6: Monitoring
- [ ] Task 6.1: Add observability
  - [x] Subtask 6.1.1: Metrics
    - [x] Activity: Expose Prometheus metrics from the API — `MetricsModule` (`apps/api/src/metrics`), `prom-client` `Counter`/`Histogram` (`http_requests_total`, `http_request_duration_seconds`) plus default Node process metrics, recorded via a global `MetricsMiddleware`, exposed unauthenticated at `GET /metrics` (flagged in code to be network-restricted in production)
  - [x] Subtask 6.1.2: Dashboards/alerts
    - [x] Activity: Build Grafana dashboards and alert rules — `k8s/monitoring/grafana-dashboard.json` (request rate/error ratio/latency percentiles/event loop lag/memory/CPU panels) and `prometheus-alert-rules.yaml` (high error rate, high p95 latency, target down, high event loop lag, high memory) as dashboard-/config-as-code; no live Grafana or Prometheus server is provisioned by this repo — that remains a separate infra decision, these are the config artifacts such a server would load

### Module 7: Logging
- [x] Task 7.1: Add structured logging
  - [x] Subtask 7.1.1: Structured log format
    - [x] Activity: Add a structured logger (pino) to the NestJS API — `nestjs-pino` wired app-wide in `apps/api/src/app.module.ts`/`main.ts` (`app.useLogger`), pretty-printed in dev, JSON in production, redacts the `Authorization` header
  - [ ] Subtask 7.1.2: Centralized log aggregation
    - [ ] Activity: Ship logs to a centralized log store — not built; needs a real log-store/provider decision

### Module 8: Performance Testing
- [x] Task 8.1: Add load/performance testing
  - [x] Subtask 8.1.1: Load test critical endpoints
    - [x] Activity: Add k6/Artillery scripts for governance workflow endpoints — `apps/api/perf/governance-workflow.k6.js` (`pnpm --filter api perf`), ramping-VU scenario against `/projects`, `/risks`, `/projects/:id/health-score`; not wired into CI (needs a live target + real credentials)

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
