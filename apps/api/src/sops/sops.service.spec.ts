import { NotFoundException } from '@nestjs/common';
import { SopsService } from './sops.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

describe('SopsService', () => {
  let service: SopsService;
  let prisma: {
    sop: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditLog: { record: jest.Mock };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const sop = {
    id: 'sop-1',
    organizationId: orgId,
    title: 'Incident Response Runbook',
    category: 'Security',
    content: 'Step 1: ...',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      sop: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new SopsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists SOPs scoped to an organization, optionally filtered by category', async () => {
    prisma.sop.findMany.mockResolvedValue([sop]);

    const result = await service.findAllInOrganization(orgId, 'Security');

    expect(prisma.sop.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, category: 'Security' },
      }),
    );
    expect(result).toEqual([sop]);
  });

  it('creates a SOP and writes a SOP_CREATED audit log entry', async () => {
    prisma.sop.create.mockResolvedValue(sop);

    const result = await service.create(orgId, actorId, {
      title: sop.title,
      category: sop.category,
      content: sop.content,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        actorId,
        action: 'SOP_CREATED',
      }),
    );
    expect(result).toEqual(sop);
  });

  it('updates a SOP and writes a SOP_UPDATED audit log entry', async () => {
    prisma.sop.findFirst.mockResolvedValue(sop);
    prisma.sop.update.mockResolvedValue({ ...sop, content: 'Updated steps' });

    const result = await service.update(sop.id, orgId, actorId, {
      content: 'Updated steps',
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        actorId,
        action: 'SOP_UPDATED',
      }),
    );
    expect(result.content).toBe('Updated steps');
  });

  it('rejects updating a SOP that is not in the caller organization', async () => {
    prisma.sop.findFirst.mockResolvedValue(null);

    await expect(
      service.update(sop.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.sop.update).not.toHaveBeenCalled();
  });
});
