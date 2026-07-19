import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';

@Injectable()
export class RequirementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.requirement.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const requirement = await this.prisma.requirement.findFirst({
      where: { id, organizationId },
    });
    if (!requirement) {
      throw new NotFoundException('Requirement not found.');
    }
    return requirement;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateRequirementDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const requirement = await this.prisma.requirement.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: requirement.projectId,
      actorId,
      action: 'REQUIREMENT_CREATED',
      metadata: { title: requirement.title },
    });
    return requirement;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateRequirementDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const requirement = await this.prisma.requirement.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.auditLog.record({
        organizationId,
        projectId: requirement.projectId,
        actorId,
        action: 'REQUIREMENT_STATUS_CHANGED',
        metadata: { from: existing.status, to: dto.status },
      });
    }

    return requirement;
  }
}
