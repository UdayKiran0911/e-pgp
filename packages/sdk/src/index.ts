// @epg/sdk (Phase 8 Module 9): a typed TypeScript client generated from the
// live OpenAPI spec (`apps/api`'s `GET /api-docs-json`), rather than
// hand-written per-endpoint wrappers. `schema.d.ts` is generated output —
// see `openapi.json` (a snapshot, regenerated via
// `pnpm --filter api export:openapi` then `pnpm --filter @epg/sdk
// generate`) and README.md in this directory for the regeneration steps.
// Publishing this to a package registry is a separate decision,
// deliberately not made here — this package exists as a workspace
// dependency other apps in this monorepo (or a future standalone
// integration) can import directly.
import createClient from 'openapi-fetch';
import type { paths } from './schema';

export type { paths as EpgApiPaths } from './schema';

export function createEpgClient(baseUrl: string, accessToken?: string) {
  return createClient<paths>({
    baseUrl,
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}

export type EpgClient = ReturnType<typeof createEpgClient>;
