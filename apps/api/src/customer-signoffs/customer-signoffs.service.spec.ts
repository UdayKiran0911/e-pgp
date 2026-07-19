import { NotFoundException } from '@nestjs/common';
import { CustomerSignoffsService } from './customer-signoffs.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { SignoffStatus } from '../../generated/prisma/client';

describe('CustomerSignoffsService', () => {
  let service: CustomerSignoffsService;
  let prisma: {
    project: { findFirst: jest.Mock };
    customerSignoff: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditLog: { record: jest.Mock };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const project = { id: 'project-1', organizationId: orgId };
  const signoff = {
    id: 'signoff-1',
    organizationId: orgId,
    projectId: project.id,
    title: 'Go-live approval',
    customerName: 'Acme Corp',
    status: SignoffStatus.PENDING,
    requestedById: actorId,
    notes: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      customerSignoff: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new CustomerSignoffsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists sign-offs scoped to an organization, optionally filtered by project', async () => {
    prisma.customerSignoff.findMany.mockResolvedValue([signoff]);

    const result = await service.findAllInOrganization(orgId, project.id);

    expect(prisma.customerSignoff.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: project.id },
      }),
    );
    expect(result).toEqual([signoff]);
  });

  it('rejects requesting a sign-off against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        title: signoff.title,
        customerName: signoff.customerName,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.customerSignoff.create).not.toHaveBeenCalled();
  });

  it('requests a sign-off and writes a CUSTOMER_SIGNOFF_REQUESTED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.customerSignoff.create.mockResolvedValue(signoff);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      title: signoff.title,
      customerName: signoff.customerName,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: project.id,
        actorId,
        action: 'CUSTOMER_SIGNOFF_REQUESTED',
      }),
    );
    expect(result).toEqual(signoff);
  });

  it('records a received sign-off and writes a CUSTOMER_SIGNOFF_STATUS_CHANGED audit log entry', async () => {
    prisma.customerSignoff.findFirst.mockResolvedValue(signoff);
    prisma.customerSignoff.update.mockResolvedValue({
      ...signoff,
      status: SignoffStatus.RECEIVED,
    });

    const result = await service.update(signoff.id, orgId, actorId, {
      status: SignoffStatus.RECEIVED,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: signoff.projectId,
        actorId,
        action: 'CUSTOMER_SIGNOFF_STATUS_CHANGED',
        metadata: { from: SignoffStatus.PENDING, to: SignoffStatus.RECEIVED },
      }),
    );
    expect(result.status).toBe(SignoffStatus.RECEIVED);
  });

  it('rejects updating a sign-off that is not in the caller organization', async () => {
    prisma.customerSignoff.findFirst.mockResolvedValue(null);

    await expect(
      service.update(signoff.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.customerSignoff.update).not.toHaveBeenCalled();
  });
});
