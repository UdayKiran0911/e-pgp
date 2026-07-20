# Monitoring config (Phase 10 Module 6)

Dashboard-as-code and alert rules for the metrics exposed at `GET /metrics`
(`apps/api/src/metrics`) — config artifacts, not a running Grafana or
Prometheus server. Standing one up (or wiring these into an existing
observability stack) is a separate infra decision, deliberately not made
here.

- `grafana-dashboard.json` — importable directly via Grafana's "Import
  dashboard" (paste the JSON) or provisioned via a `dashboards` ConfigMap
  if using the Grafana Helm chart's sidecar-based provisioning. Panels:
  request rate by status code, 5xx error ratio, p50/p95/p99 latency,
  requests by route, event loop lag, resident memory, CPU usage.
- `prometheus-alert-rules.yaml` — plain Prometheus rule-file format,
  loadable via `rule_files:` in a Prometheus config, or portable to a
  `PrometheusRule` CRD if the cluster runs kube-prometheus-stack. Alerts:
  high 5xx rate, high p95 latency, target down, high event loop lag, high
  memory usage (relative to the `512Mi` limit in
  `k8s/base/api-deployment.yaml`).
