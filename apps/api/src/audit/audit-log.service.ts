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
}
