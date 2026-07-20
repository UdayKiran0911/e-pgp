import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { LocalDiskStorageService } from '../storage/local-disk-storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';

interface UploadFileInput {
  projectId: string;
  title: string;
  version?: string;
  buffer: Buffer;
  originalFilename: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly storage: LocalDiskStorageService,
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

  // Uploads a real file to the local-disk StorageProvider and records it
  // as a Document whose `url` points back at our own download endpoint
  // (`storageKey` set) rather than an external link.
  async uploadFile(
    organizationId: string,
    actorId: string,
    input: UploadFileInput,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: input.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const storageKey = await this.storage.save(
      input.buffer,
      input.originalFilename,
    );
    const id = randomUUID();

    const document = await this.prisma.document.create({
      data: {
        id,
        organizationId,
        projectId: input.projectId,
        title: input.title,
        url: `/documents/${id}/download`,
        storageKey,
        version: input.version,
      },
    });

    await this.auditLog.record({
      organizationId,
      projectId: document.projectId,
      actorId,
      action: 'DOCUMENT_UPLOADED',
      metadata: { title: document.title, version: document.version },
    });
    return document;
  }

  async getFileForDownload(id: string, organizationId: string) {
    const document = await this.findOneInOrganization(id, organizationId);
    if (!document.storageKey) {
      throw new NotFoundException(
        'This document is an external link, not an uploaded file.',
      );
    }
    const extension = extname(document.storageKey);
    const downloadName = document.title.endsWith(extension)
      ? document.title
      : `${document.title}${extension}`;
    return {
      title: downloadName,
      absolutePath: this.storage.getAbsolutePath(document.storageKey),
    };
  }
}
