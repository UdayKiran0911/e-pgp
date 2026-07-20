# Kubernetes manifests (Phase 10 Module 4)

Base manifests in `k8s/base/`, with dev/staging/prod overlays in
`k8s/overlays/`, applied via Kustomize:

```bash
kubectl apply -k k8s/overlays/dev        # or staging, or prod
kubectl apply -f k8s/base/secret.yaml    # copy from secret.example.yaml first, fill in real values
```

## What's here

- `namespace.yaml`, `configmap.yaml` — non-secret config
- `secret.example.yaml` — template; the real `secret.yaml` is gitignored
  and applied separately, never through Kustomize/CI
- `api-deployment.yaml` / `api-service.yaml` — the NestJS API, 2 replicas,
  `/health` readiness+liveness probes
- `web-deployment.yaml` / `web-service.yaml` — the Next.js app, 2 replicas
- `ingress.yaml` — nginx-ingress routing `/api` → API, `/` → web
- `overlays/dev` — 1 replica of each app, lower resource requests,
  `NODE_ENV=development`, `dev-` name prefix + `epg-platform-dev`
  namespace
- `overlays/staging` — mirrors the base (prod-shaped) replica counts on a
  separate `staging-` prefixed namespace, so staging catches
  multi-replica issues before prod does
- `overlays/prod` — the base manifests already reflect prod-shaped
  defaults; this overlay mainly gives prod its own namespace/prefix so
  all three environments stay symmetrical

Image tags are left as the base manifests' placeholders in every
overlay — no `images:` transformer is wired in, since no real container
registry/org has been decided (see "Deliberately not built" below).

## Deliberately not built

- **Environment-specific image tags** — the overlays don't pin real
  `ghcr.io/<org>/...` image references per environment; that needs a real
  registry/org decision, same reasoning as the base manifests'
  placeholders.
- **Helm chart** — Kustomize overlays only, no Helm values-per-environment
  alternative.
- **Infrastructure as Code** (Phase 10 Module 5) — these manifests assume
  a cluster and container registry already exist. Provisioning them
  (Terraform/Pulumi) needs a real cloud-provider decision, not made here.
- **Document upload storage** — `LocalDiskStorageService` writes to each
  API pod's local disk. With `replicas: 2` that means uploads aren't
  visible across pods. Fine for a single-replica dev/demo deploy; a real
  multi-replica rollout needs either a shared volume or (better) swapping
  in a cloud-storage `StorageProvider` implementation (see
  `apps/api/src/storage`) — the interface was designed for exactly this
  swap, but the swap itself isn't done.
