import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateRiskDto } from './dto/create-risk.dto';
import { UpdateRiskDto } from './dto/update-risk.dto';

@Injectable()
export class RisksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.risk.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const risk = await this.prisma.risk.findFirst({
      where: { id, organizationId },
    });
    if (!risk) {
      throw new NotFoundException('Risk not found.');
    }
    return risk;
  }

  async create(organizationId: string, actorId: string, dto: CreateRiskDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const risk = await this.prisma.risk.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
        likelihood: dto.likelihood,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: risk.projectId,
      actorId,
      action: 'RISK_CREATED',
      metadata: {
        title: risk.title,
        severity: risk.severity,
        likelihood: risk.likelihood,
      },
    });
    return risk;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateRiskDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const risk = await this.prisma.risk.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.auditLog.record({
        organizationId,
        projectId: risk.projectId,
        actorId,
        action: 'RISK_STATUS_CHANGED',
        metadata: { from: existing.status, to: dto.status },
      });
    }

    return risk;
  }
}
