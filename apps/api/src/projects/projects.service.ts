import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { isValidTransition } from './project-status';
import { isValidGovernanceTransition } from './governance-stage';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string) {
    return this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    return project;
  }

  async create(organizationId: string, actorId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: { name: dto.name, organizationId },
    });
    await this.auditLog.record({
      organizationId,
      projectId: project.id,
      actorId,
      action: 'PROJECT_CREATED',
      metadata: { name: project.name },
    });
    return project;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateProjectDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    if (dto.status && !isValidTransition(existing.status, dto.status)) {
      throw new BadRequestException(
        `Cannot move a project from ${existing.status} to ${dto.status}.`,
      );
    }

    if (
      dto.governanceStage &&
      !isValidGovernanceTransition(
        existing.governanceStage,
        dto.governanceStage,
      )
    ) {
      throw new BadRequestException(
        `Cannot move a project's governance stage from ${existing.governanceStage} to ${dto.governanceStage}.`,
      );
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.auditLog.record({
        organizationId,
        projectId: project.id,
        actorId,
        action: 'PROJECT_STATUS_CHANGED',
        metadata: { from: existing.status, to: dto.status },
      });
    }

    if (
      dto.governanceStage &&
      dto.governanceStage !== existing.governanceStage
    ) {
      await this.auditLog.record({
        organizationId,
        projectId: project.id,
        actorId,
        action: 'GOVERNANCE_STAGE_ADVANCED',
        metadata: { from: existing.governanceStage, to: dto.governanceStage },
      });
    }

    return project;
  }
}
