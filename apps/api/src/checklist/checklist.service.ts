import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';

@Injectable()
export class ChecklistService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.checklistItem.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const item = await this.prisma.checklistItem.findFirst({
      where: { id, organizationId },
    });
    if (!item) {
      throw new NotFoundException('Checklist item not found.');
    }
    return item;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateChecklistItemDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const item = await this.prisma.checklistItem.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: item.projectId,
      actorId,
      action: 'CHECKLIST_ITEM_ADDED',
      metadata: { title: item.title },
    });
    return item;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateChecklistItemDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const item = await this.prisma.checklistItem.update({
      where: { id },
      data: dto,
    });

    if (dto.isDone !== undefined && dto.isDone !== existing.isDone) {
      await this.auditLog.record({
        organizationId,
        projectId: item.projectId,
        actorId,
        action: 'CHECKLIST_ITEM_TOGGLED',
        metadata: { title: item.title, isDone: item.isDone },
      });
    }

    return item;
  }
}
