import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.document.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id, organizationId },
    });
    if (!document) {
      throw new NotFoundException('Document not found.');
    }
    return document;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateDocumentDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const document = await this.prisma.document.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        url: dto.url,
        version: dto.version,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: document.projectId,
      actorId,
      action: 'DOCUMENT_ADDED',
      metadata: { title: document.title, version: document.version },
    });
    return document;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateDocumentDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const document = await this.prisma.document.update({
      where: { id },
      data: dto,
    });

    if (dto.version && dto.version !== existing.version) {
      await this.auditLog.record({
        organizationId,
        projectId: document.projectId,
        actorId,
        action: 'DOCUMENT_UPDATED',
        metadata: {
          title: document.title,
          from: existing.version,
          to: dto.version,
        },
      });
    }

    return document;
  }
}
