import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: {
    auditLog: { create: jest.Mock; findMany: jest.Mock };
  };

  const orgId = 'org-1';

  beforeEach(() => {
    prisma = {
      auditLog: { create: jest.fn(), findMany: jest.fn() },
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
});
