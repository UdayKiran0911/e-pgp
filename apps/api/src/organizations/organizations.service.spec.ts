import { NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

function emptyFindMany() {
  return { findMany: jest.fn().mockResolvedValue([]) };
}

interface MockPrisma {
  organization: { findUnique: jest.Mock; update: jest.Mock };
  user: { findMany: jest.Mock };
  project: { findMany: jest.Mock };
  risk: { findMany: jest.Mock };
  issue: { findMany: jest.Mock };
  decision: { findMany: jest.Mock };
  requirement: { findMany: jest.Mock };
  review: { findMany: jest.Mock };
  changeRequest: { findMany: jest.Mock };
  checklistItem: { findMany: jest.Mock };
  document: { findMany: jest.Mock };
  governanceGate: { findMany: jest.Mock };
  customerSignoff: { findMany: jest.Mock };
  deploymentApproval: { findMany: jest.Mock };
  department: { findMany: jest.Mock };
  sop: { findMany: jest.Mock };
  knowledgeArticle: { findMany: jest.Mock };
  securityFinding: { findMany: jest.Mock };
}

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: MockPrisma;
  let auditLog: { record: jest.Mock };

  const org = { id: 'org-1', name: 'Acme Corp' };
  const actorId = 'user-1';

  beforeEach(() => {
    prisma = {
      organization: { findUnique: jest.fn(), update: jest.fn() },
      user: emptyFindMany(),
      project: emptyFindMany(),
      risk: emptyFindMany(),
      issue: emptyFindMany(),
      decision: emptyFindMany(),
      requirement: emptyFindMany(),
      review: emptyFindMany(),
      changeRequest: emptyFindMany(),
      checklistItem: emptyFindMany(),
      document: emptyFindMany(),
      governanceGate: emptyFindMany(),
      customerSignoff: emptyFindMany(),
      deploymentApproval: emptyFindMany(),
      department: emptyFindMany(),
      sop: emptyFindMany(),
      knowledgeArticle: emptyFindMany(),
      securityFinding: emptyFindMany(),
    };
    auditLog = { record: jest.fn() };
    service = new OrganizationsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('returns the organization when it exists', async () => {
    prisma.organization.findUnique.mockResolvedValue(org);

    await expect(service.findOne(org.id)).resolves.toEqual(org);
  });

  it('throws when the organization does not exist', async () => {
    prisma.organization.findUnique.mockResolvedValue(null);

    await expect(service.findOne('missing-org')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates the organization name and writes an ORGANIZATION_UPDATED audit log entry', async () => {
    prisma.organization.findUnique.mockResolvedValue(org);
    prisma.organization.update.mockResolvedValue({ ...org, name: 'New Name' });

    const result = await service.update(org.id, actorId, { name: 'New Name' });

    expect(result.name).toBe('New Name');
    expect(prisma.organization.update).toHaveBeenCalledWith({
      where: { id: org.id },
      data: { name: 'New Name' },
    });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: org.id,
        actorId,
        action: 'ORGANIZATION_UPDATED',
        metadata: { from: org.name, to: 'New Name' },
      }),
    );
  });

  it('does not write an audit log entry when the name is unchanged', async () => {
    prisma.organization.findUnique.mockResolvedValue(org);
    prisma.organization.update.mockResolvedValue(org);

    await service.update(org.id, actorId, { name: org.name });

    expect(auditLog.record).not.toHaveBeenCalled();
  });

  describe('exportData', () => {
    it('bundles every register into one snapshot and writes an ORGANIZATION_DATA_EXPORTED audit log entry', async () => {
      prisma.organization.findUnique.mockResolvedValue(org);
      prisma.project.findMany = jest
        .fn()
        .mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
      prisma.risk.findMany = jest.fn().mockResolvedValue([{ id: 'r1' }]);

      const result = await service.exportData(org.id, actorId);

      expect(result.organization).toEqual(org);
      expect(result.projects).toEqual([{ id: 'p1' }, { id: 'p2' }]);
      expect(result.risks).toEqual([{ id: 'r1' }]);
      expect(result.exportedAt).toEqual(expect.any(String));
      expect(auditLog.record).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: org.id,
          actorId,
          action: 'ORGANIZATION_DATA_EXPORTED',
          metadata: { projectCount: 2, userCount: 0 },
        }),
      );
    });

    it('never includes passwordHash in the exported user list', async () => {
      prisma.organization.findUnique.mockResolvedValue(org);

      await service.exportData(org.id, actorId);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        }),
      );
    });
  });
});
