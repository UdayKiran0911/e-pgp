import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client';

export interface RecordAuditLogParams {
  organizationId: string;
  actorId: string;
  action: string;
  projectId?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Every governed mutation in the platform writes through here — never
 * `prisma.auditLog.create` directly — so the audit trail stays consistent
 * as new modules add their own governed actions.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  record(params: RecordAuditLogParams) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.actorId,
        action: params.action,
        projectId: params.projectId,
        metadata: params.metadata,
      },
    });
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
