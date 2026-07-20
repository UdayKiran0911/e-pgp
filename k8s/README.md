# Kubernetes manifests (Phase 10 Module 4)

Base manifests only — `k8s/base/`, applied via Kustomize:

```bash
kubectl apply -k k8s/base
kubectl apply -f k8s/base/secret.yaml   # copy from secret.example.yaml first, fill in real values
```

## What's here

- `namespace.yaml`, `configmap.yaml` — non-secret config
- `secret.example.yaml` — template; the real `secret.yaml` is gitignored
  and applied separately, never through Kustomize/CI
- `api-deployment.yaml` / `api-service.yaml` — the NestJS API, 2 replicas,
  `/health` readiness+liveness probes
- `web-deployment.yaml` / `web-service.yaml` — the Next.js app, 2 replicas
- `ingress.yaml` — nginx-ingress routing `/api` → API, `/` → web

## Deliberately not built

- **Environment overlays** (Phase 10 Module 4 Subtask 4.1.2) — no
  dev/staging/prod Kustomize overlays or Helm values yet; there's one
  base config, replace the placeholder image references and `host`
  manually per environment for now.
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
