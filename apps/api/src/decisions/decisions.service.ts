import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';

@Injectable()
export class DecisionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.decision.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { decidedAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const decision = await this.prisma.decision.findFirst({
      where: { id, organizationId },
    });
    if (!decision) {
      throw new NotFoundException('Decision not found.');
    }
    return decision;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateDecisionDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const decision = await this.prisma.decision.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        context: dto.context,
        decision: dto.decision,
        decidedById: actorId,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: decision.projectId,
      actorId,
      action: 'DECISION_LOGGED',
      metadata: { title: decision.title },
    });
    return decision;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateDecisionDto,
  ) {
    await this.findOneInOrganization(id, organizationId);

    const decision = await this.prisma.decision.update({
      where: { id },
      data: dto,
    });

    await this.auditLog.record({
      organizationId,
      projectId: decision.projectId,
      actorId,
      action: 'DECISION_UPDATED',
      metadata: { title: decision.title },
    });

    return decision;
  }
}
