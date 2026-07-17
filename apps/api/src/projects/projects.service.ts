import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { isValidTransition } from './project-status';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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
    await this.prisma.auditLog.create({
      data: {
        projectId: project.id,
        actorId,
        action: 'PROJECT_CREATED',
        metadata: { name: project.name },
      },
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

    const project = await this.prisma.project.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.prisma.auditLog.create({
        data: {
          projectId: project.id,
          actorId,
          action: 'PROJECT_STATUS_CHANGED',
          metadata: { from: existing.status, to: dto.status },
        },
      });
    }

    return project;
  }
}
