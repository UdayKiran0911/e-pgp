# @epg/sdk

A typed TypeScript client for the EPG Platform API, generated from the live
OpenAPI spec rather than hand-written per-endpoint.

```ts
import { createEpgClient } from '@epg/sdk';

const client = createEpgClient('http://localhost:4000', accessToken);
const { data, error } = await client.GET('/projects');
```

Every path, method, request body, and response shape is fully typed,
sourced straight from `apps/api`'s controllers and DTOs via
`@nestjs/swagger` — there is no manually-maintained method per endpoint to
drift out of sync.

## Regenerating

Run whenever a route or DTO changes in `apps/api`:

```bash
pnpm --filter api export:openapi   # writes packages/sdk/openapi.json
pnpm --filter @epg/sdk generate    # writes packages/sdk/src/schema.d.ts
```

Both `openapi.json` and `schema.d.ts` are checked in as a snapshot (same
reasoning as `docs/ER_DIAGRAM.md`) — not regenerated automatically or
enforced in CI, so they can drift from the live API if a route changes
without re-running the two commands above.

## Not built here

Publishing `@epg/sdk` to a package registry (npm, a private registry) is a
separate decision, deliberately not made — this package is consumed as a
workspace dependency (`workspace:*`) for now.
