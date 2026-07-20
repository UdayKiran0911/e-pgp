import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { computeAuditLogHash } from './audit-hash.util';

export interface RecordAuditLogParams {
  organizationId: string;
  actorId: string;
  action: string;
  projectId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface AuditChainVerification {
  valid: boolean;
  checked: number;
  brokenAtId: string | null;
}

/**
 * Every governed mutation in the platform writes through here — never
 * `prisma.auditLog.create` directly — so the audit trail stays consistent
 * as new modules add their own governed actions.
 *
 * Each entry is hash-chained (Phase 9 Module 6 — tamper-evidence): `hash`
 * covers the row's own content plus the previous entry's hash, per
 * organization. See `audit-hash.util.ts` and `verifyChain()` below.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: RecordAuditLogParams) {
    const previous = await this.prisma.auditLog.findFirst({
      where: { organizationId: params.organizationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { hash: true },
    });
    const id = randomUUID();
    const createdAt = new Date();
    const previousHash = previous?.hash ?? null;
    const hash = computeAuditLogHash({
      id,
      organizationId: params.organizationId,
      projectId: params.projectId ?? null,
      actorId: params.actorId,
      action: params.action,
      metadata: params.metadata ?? null,
      previousHash,
      createdAt,
    });
    return this.prisma.auditLog.create({
      data: {
        id,
        organizationId: params.organizationId,
        actorId: params.actorId,
        action: params.action,
        projectId: params.projectId,
        metadata: params.metadata,
        previousHash,
        hash,
        createdAt,
      },
    });
  }

  async verifyChain(organizationId: string): Promise<AuditChainVerification> {
    const entries = await this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    let expectedPreviousHash: string | null = null;
    for (const entry of entries) {
      const recomputed = computeAuditLogHash({
        id: entry.id,
        organizationId: entry.organizationId,
        projectId: entry.projectId,
        actorId: entry.actorId,
        action: entry.action,
        metadata: entry.metadata,
        previousHash: entry.previousHash,
        createdAt: entry.createdAt,
      });
      if (
        entry.previousHash !== expectedPreviousHash ||
        entry.hash !== recomputed
      ) {
        return { valid: false, checked: entries.length, brokenAtId: entry.id };
      }
      expectedPreviousHash = entry.hash;
    }
    return { valid: true, checked: entries.length, brokenAtId: null };
  }

  findAllInOrganization(organizationId: string) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
      take: 200,
    });
  }

  // AI Audit Assistant (Phase 7 Module 3), simplified: a computed summary
  // (total + per-action counts, optionally scoped to a project) rather
  // than a free-form "explain this project's audit trail" LLM answer. A
  // real AI-backed assistant is a separate decision, deliberately not
  // made here.
  async summarize(organizationId: string, projectId?: string) {
    const where = { organizationId, ...(projectId ? { projectId } : {}) };
    const [totalActions, grouped] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
    ]);
    const byAction = Object.fromEntries(
      grouped.map((g) => [g.action, g._count.action]),
    );
    return { totalActions, byAction };
  }
}
