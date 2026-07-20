import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import { ApplyChecklistTemplateDto } from './dto/apply-checklist-template.dto';

@Injectable()
export class ChecklistTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string) {
    return this.prisma.checklistTemplate.findMany({
      where: { organizationId },
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const template = await this.prisma.checklistTemplate.findFirst({
      where: { id, organizationId },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    if (!template) {
      throw new NotFoundException('Checklist template not found.');
    }
    return template;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateChecklistTemplateDto,
  ) {
    const template = await this.prisma.checklistTemplate.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        items: {
          create: dto.items.map((title, index) => ({ title, order: index })),
        },
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });
    await this.auditLog.record({
      organizationId,
      actorId,
      action: 'CHECKLIST_TEMPLATE_CREATED',
      metadata: { name: template.name, itemCount: dto.items.length },
    });
    return template;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateChecklistTemplateDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const template = await this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        await tx.checklistTemplateItem.deleteMany({
          where: { templateId: id },
        });
      }
      return tx.checklistTemplate.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          ...(dto.items
            ? {
                items: {
                  create: dto.items.map((title, index) => ({
                    title,
                    order: index,
                  })),
                },
              }
            : {}),
        },
        include: { items: { orderBy: { order: 'asc' } } },
      });
    });

    await this.auditLog.record({
      organizationId,
      actorId,
      action: 'CHECKLIST_TEMPLATE_UPDATED',
      metadata: { name: existing.name },
    });

    return template;
  }

  // Bulk-creates ChecklistItems on the target project from the template's
  // current items — a snapshot copy, not a live link, so later template
  // edits never retroactively change an already-applied project checklist.
  async apply(
    organizationId: string,
    actorId: string,
    templateId: string,
    dto: ApplyChecklistTemplateDto,
  ) {
    const template = await this.findOneInOrganization(
      templateId,
      organizationId,
    );
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    await this.prisma.checklistItem.createMany({
      data: template.items.map((item) => ({
        organizationId,
        projectId: dto.projectId,
        title: item.title,
      })),
    });

    await this.auditLog.record({
      organizationId,
      projectId: dto.projectId,
      actorId,
      action: 'CHECKLIST_TEMPLATE_APPLIED',
      metadata: {
        templateName: template.name,
        itemCount: template.items.length,
      },
    });

    return this.prisma.checklistItem.findMany({
      where: { organizationId, projectId: dto.projectId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
