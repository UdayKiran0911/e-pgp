import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';

@Injectable()
export class IssuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.issue.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const issue = await this.prisma.issue.findFirst({
      where: { id, organizationId },
    });
    if (!issue) {
      throw new NotFoundException('Issue not found.');
    }
    return issue;
  }

  async create(organizationId: string, actorId: string, dto: CreateIssueDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const issue = await this.prisma.issue.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: issue.projectId,
      actorId,
      action: 'ISSUE_CREATED',
      metadata: { title: issue.title, priority: issue.priority },
    });
    return issue;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateIssueDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const issue = await this.prisma.issue.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.auditLog.record({
        organizationId,
        projectId: issue.projectId,
        actorId,
        action: 'ISSUE_STATUS_CHANGED',
        metadata: { from: existing.status, to: dto.status },
      });
    }

    return issue;
  }
}
