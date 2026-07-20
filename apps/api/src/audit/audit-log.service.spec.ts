import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: {
    auditLog: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      groupBy: jest.Mock;
    };
  };

  const orgId = 'org-1';

  beforeEach(() => {
    prisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
    };
    service = new AuditLogService(prisma as unknown as PrismaService);
  });

  it('records an audit log entry scoped to the organization', async () => {
    prisma.auditLog.create.mockResolvedValue({ id: 'log-1' });

    await service.record({
      organizationId: orgId,
      actorId: 'user-1',
      action: 'PROJECT_CREATED',
      projectId: 'project-1',
      metadata: { name: 'Website Revamp' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        organizationId: orgId,
        actorId: 'user-1',
        action: 'PROJECT_CREATED',
        projectId: 'project-1',
        metadata: { name: 'Website Revamp' },
      },
    });
  });

  it('lists audit log entries for an organization, newest first, with project names attached', async () => {
    prisma.auditLog.findMany.mockResolvedValue([]);

    await service.findAllInOrganization(orgId);

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId },
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { id: true, name: true } } },
      }),
    );
  });

  it('summarizes total and per-action audit log counts', async () => {
    prisma.auditLog.count.mockResolvedValue(5);
    prisma.auditLog.groupBy.mockResolvedValue([
      { action: 'RISK_CREATED', _count: { action: 3 } },
      { action: 'RISK_STATUS_CHANGED', _count: { action: 2 } },
    ]);

    const result = await service.summarize(orgId);

    expect(result).toEqual({
      totalActions: 5,
      byAction: { RISK_CREATED: 3, RISK_STATUS_CHANGED: 2 },
    });
  });

  it('scopes the summary to a project when given one', async () => {
    prisma.auditLog.count.mockResolvedValue(0);
    prisma.auditLog.groupBy.mockResolvedValue([]);

    await service.summarize(orgId, 'project-1');

    expect(prisma.auditLog.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: 'project-1' },
      }),
    );
  });
});
