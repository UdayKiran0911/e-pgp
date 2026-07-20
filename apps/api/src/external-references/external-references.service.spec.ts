import { NotFoundException } from '@nestjs/common';
import { ExternalReferencesService } from './external-references.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

describe('ExternalReferencesService', () => {
  let service: ExternalReferencesService;
  let prisma: {
    issue: { findFirst: jest.Mock };
    externalReference: {
      findMany: jest.Mock;
      create: jest.Mock;
      findFirst: jest.Mock;
      delete: jest.Mock;
    };
  };
  let auditLog: { record: jest.Mock };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const issue = {
    id: 'issue-1',
    projectId: 'project-1',
    organizationId: orgId,
  };

  beforeEach(() => {
    prisma = {
      issue: { findFirst: jest.fn() },
      externalReference: {
        findMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new ExternalReferencesService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  describe('findAllForIssue', () => {
    it('rejects an issue that is not in the caller organization', async () => {
      prisma.issue.findFirst.mockResolvedValue(null);

      await expect(
        service.findAllForIssue('issue-1', orgId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lists references for an issue, newest first', async () => {
      prisma.issue.findFirst.mockResolvedValue(issue);
      prisma.externalReference.findMany.mockResolvedValue([]);

      await service.findAllForIssue('issue-1', orgId);

      expect(prisma.externalReference.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { issueId: 'issue-1', organizationId: orgId },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('create', () => {
    it('rejects linking a reference to an issue outside the caller organization', async () => {
      prisma.issue.findFirst.mockResolvedValue(null);

      await expect(
        service.create(orgId, actorId, {
          issueId: 'issue-1',
          provider: 'JIRA',
          externalId: 'EPG-42',
          url: 'https://acme.atlassian.net/browse/EPG-42',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('creates a reference and writes an EXTERNAL_REFERENCE_LINKED audit log entry', async () => {
      prisma.issue.findFirst.mockResolvedValue(issue);
      const created = {
        id: 'ref-1',
        organizationId: orgId,
        issueId: 'issue-1',
        provider: 'JIRA',
        externalId: 'EPG-42',
        url: 'https://acme.atlassian.net/browse/EPG-42',
      };
      prisma.externalReference.create.mockResolvedValue(created);

      const result = await service.create(orgId, actorId, {
        issueId: 'issue-1',
        provider: 'JIRA',
        externalId: 'EPG-42',
        url: 'https://acme.atlassian.net/browse/EPG-42',
      });

      expect(result).toEqual(created);
      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: orgId,
          projectId: issue.projectId,
          actorId,
          action: 'EXTERNAL_REFERENCE_LINKED',
        }),
      );
    });
  });

  describe('remove', () => {
    it('rejects removing a reference that is not in the caller organization', async () => {
      prisma.externalReference.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('ref-1', orgId, actorId),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.externalReference.delete).not.toHaveBeenCalled();
    });

    it('deletes the reference and writes an EXTERNAL_REFERENCE_UNLINKED audit log entry', async () => {
      prisma.externalReference.findFirst.mockResolvedValue({
        id: 'ref-1',
        organizationId: orgId,
        issueId: 'issue-1',
        provider: 'JIRA',
        issue: { projectId: 'project-1' },
      });

      await service.remove('ref-1', orgId, actorId);

      expect(prisma.externalReference.delete).toHaveBeenCalledWith({
        where: { id: 'ref-1' },
      });
      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EXTERNAL_REFERENCE_UNLINKED',
          projectId: 'project-1',
        }),
      );
    });
  });
});
