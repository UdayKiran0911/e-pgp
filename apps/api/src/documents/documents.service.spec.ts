import { NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { LocalDiskStorageService } from '../storage/local-disk-storage.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: {
    project: { findFirst: jest.Mock };
    document: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditLog: { record: jest.Mock };
  let storage: {
    save: jest.Mock;
    getAbsolutePath: jest.Mock;
    delete: jest.Mock;
  };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const project = { id: 'project-1', organizationId: orgId };
  const document = {
    id: 'doc-1',
    organizationId: orgId,
    projectId: project.id,
    title: 'Solution Design Doc',
    url: 'https://docs.example.com/solution-design',
    version: '1.0',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      document: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    storage = {
      save: jest.fn().mockResolvedValue('generated-key.pdf'),
      getAbsolutePath: jest.fn().mockReturnValue('/uploads/generated-key.pdf'),
      delete: jest.fn(),
    };
    service = new DocumentsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
      storage as unknown as LocalDiskStorageService,
    );
  });

  it('lists documents scoped to an organization, optionally filtered by project', async () => {
    prisma.document.findMany.mockResolvedValue([document]);

    const result = await service.findAllInOrganization(orgId, project.id);

    expect(prisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: project.id },
      }),
    );
    expect(result).toEqual([document]);
  });

  it('rejects adding a document against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        title: document.title,
        url: document.url,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.document.create).not.toHaveBeenCalled();
  });

  it('adds a document and writes a DOCUMENT_ADDED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.document.create.mockResolvedValue(document);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      title: document.title,
      url: document.url,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: project.id,
        actorId,
        action: 'DOCUMENT_ADDED',
      }),
    );
    expect(result).toEqual(document);
  });

  it('bumps the version and writes a DOCUMENT_UPDATED audit log entry', async () => {
    prisma.document.findFirst.mockResolvedValue(document);
    prisma.document.update.mockResolvedValue({ ...document, version: '2.0' });

    const result = await service.update(document.id, orgId, actorId, {
      version: '2.0',
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: document.projectId,
        actorId,
        action: 'DOCUMENT_UPDATED',
        metadata: { title: document.title, from: '1.0', to: '2.0' },
      }),
    );
    expect(result.version).toBe('2.0');
  });

  it('rejects updating a document that is not in the caller organization', async () => {
    prisma.document.findFirst.mockResolvedValue(null);

    await expect(
      service.update(document.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.document.update).not.toHaveBeenCalled();
  });

  describe('uploadFile', () => {
    it('rejects uploading against a project outside the caller organization', async () => {
      prisma.project.findFirst.mockResolvedValue(null);

      await expect(
        service.uploadFile(orgId, actorId, {
          projectId: project.id,
          title: 'Threat Model',
          buffer: Buffer.from('pdf-bytes'),
          originalFilename: 'threat-model.pdf',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(storage.save).not.toHaveBeenCalled();
    });

    it('saves the file via the storage provider and points url at the download endpoint', async () => {
      prisma.project.findFirst.mockResolvedValue(project);
      prisma.document.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) => Promise.resolve(data),
      );

      const result = await service.uploadFile(orgId, actorId, {
        projectId: project.id,
        title: 'Threat Model',
        buffer: Buffer.from('pdf-bytes'),
        originalFilename: 'threat-model.pdf',
      });

      expect(storage.save).toHaveBeenCalledWith(
        Buffer.from('pdf-bytes'),
        'threat-model.pdf',
      );
      expect(result.storageKey).toBe('generated-key.pdf');
      expect(result.url).toBe(`/documents/${result.id}/download`);
      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DOCUMENT_UPLOADED' }),
      );
    });
  });

  describe('getFileForDownload', () => {
    it('rejects a document that is an external link, not an uploaded file', async () => {
      prisma.document.findFirst.mockResolvedValue({
        ...document,
        storageKey: null,
      });

      await expect(
        service.getFileForDownload(document.id, orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('resolves the absolute path via the storage provider for an uploaded file', async () => {
      prisma.document.findFirst.mockResolvedValue({
        ...document,
        storageKey: 'generated-key.pdf',
      });

      const result = await service.getFileForDownload(document.id, orgId);

      expect(storage.getAbsolutePath).toHaveBeenCalledWith('generated-key.pdf');
      expect(result).toEqual({
        title: `${document.title}.pdf`,
        absolutePath: '/uploads/generated-key.pdf',
      });
    });
  });
});
