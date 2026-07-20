import { createHash } from 'crypto';

export interface AuditHashInput {
  id: string;
  organizationId: string;
  projectId: string | null;
  actorId: string;
  action: string;
  metadata: unknown;
  previousHash: string | null;
  createdAt: Date;
}

// Postgres JSONB does not preserve object key order on read-back, so
// hashing `JSON.stringify(metadata)` directly would make a row that was
// never tampered with fail verification just because Postgres reordered
// its keys. Sorting keys recursively before stringifying makes the hash
// stable regardless of storage-layer reordering.
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
  );
  return `{${entries
    .map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`)
    .join(',')}}`;
}

export function computeAuditLogHash(input: AuditHashInput): string {
  const payload = [
    input.id,
    input.organizationId,
    input.projectId ?? '',
    input.actorId,
    input.action,
    stableStringify(input.metadata ?? null),
    input.previousHash ?? '',
    input.createdAt.toISOString(),
  ].join('|');
  return createHash('sha256').update(payload).digest('hex');
}
