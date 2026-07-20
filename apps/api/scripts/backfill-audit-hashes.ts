// One-off backfill for the AuditLog hash chain (Phase 9 Module 6). Run once
// against the existing database after the `hash`/`previousHash` columns
// were added nullable, before the follow-up migration makes `hash` NOT
// NULL. Uses the exact same hash formula as `AuditLogService.record()`, so
// the backfilled rows verify correctly against `verifyChain()` — not a
// placeholder chain. Chains per organization, oldest-first.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { computeAuditLogHash } from '../src/audit/audit-hash.util';

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const organizations = await prisma.organization.findMany({ select: { id: true } });

  let totalUpdated = 0;
  for (const { id: organizationId } of organizations) {
    const entries = await prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    let previousHash: string | null = null;
    for (const entry of entries) {
      const hash = computeAuditLogHash({
        id: entry.id,
        organizationId: entry.organizationId,
        projectId: entry.projectId,
        actorId: entry.actorId,
        action: entry.action,
        metadata: entry.metadata,
        previousHash,
        createdAt: entry.createdAt,
      });
      await prisma.auditLog.update({
        where: { id: entry.id },
        data: { hash, previousHash },
      });
      previousHash = hash;
      totalUpdated += 1;
    }
  }

  console.log(`Backfilled hash chain for ${totalUpdated} audit log entries across ${organizations.length} organization(s).`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
