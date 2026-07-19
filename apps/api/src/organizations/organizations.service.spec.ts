import { NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: {
    organization: { findUnique: jest.Mock; update: jest.Mock };
  };
  let auditLog: { record: jest.Mock };

  const org = { id: 'org-1', name: 'Acme Corp' };
  const actorId = 'user-1';

  beforeEach(() => {
    prisma = {
      organization: { findUnique: jest.fn(), update: jest.fn() },
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
});
