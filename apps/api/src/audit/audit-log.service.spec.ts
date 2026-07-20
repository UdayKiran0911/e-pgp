import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { computeAuditLogHash } from './audit-hash.util';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: {
    auditLog: {
      create: jest.Mock;
      findFirst: jest.Mock;
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
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
    };
    service = new AuditLogService(prisma as unknown as PrismaService);
  });

  it("records an audit log entry chained off the previous entry's hash", async () => {
    prisma.auditLog.findFirst.mockResolvedValue({ hash: 'prev-hash' });
    prisma.auditLog.create.mockImplementation(
      (args: { data: Record<string, unknown> }) => Promise.resolve(args.data),
    );

    const result = (await service.record({
      organizationId: orgId,
      actorId: 'user-1',
      action: 'PROJECT_CREATED',
      projectId: 'project-1',
      metadata: { name: 'Website Revamp' },
    })) as {
      organizationId: string;
      actorId: string;
      action: string;
      previousHash: string | null;
      hash: string;
      id: string;
    };

    expect(prisma.auditLog.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: orgId } }),
    );
    expect(result.previousHash).toBe('prev-hash');
    expect(typeof result.hash).toBe('string');
    expect(result.hash).not.toBe('prev-hash');
    expect(result.organizationId).toBe(orgId);
    expect(result.actorId).toBe('user-1');
    expect(result.action).toBe('PROJECT_CREATED');
    expect(typeof result.id).toBe('string');
  });

  it('uses a null previousHash for the first entry in an organization', async () => {
    prisma.auditLog.findFirst.mockResolvedValue(null);
    prisma.auditLog.create.mockImplementation(
      (args: { data: Record<string, unknown> }) => Promise.resolve(args.data),
    );

    const result = (await service.record({
      organizationId: orgId,
      actorId: 'user-1',
      action: 'PROJECT_CREATED',
    })) as { previousHash: string | null };

    expect(result.previousHash).toBeNull();
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

  describe('verifyChain', () => {
    const entry1CreatedAt = new Date('2026-01-01T00:00:00Z');
    const entry2CreatedAt = new Date('2026-01-02T00:00:00Z');
    const entry1Hash = computeAuditLogHash({
      id: 'log-1',
      organizationId: orgId,
      projectId: null,
      actorId: 'user-1',
      action: 'PROJECT_CREATED',
      metadata: null,
      previousHash: null,
      createdAt: entry1CreatedAt,
    });
    const entry2Hash = computeAuditLogHash({
      id: 'log-2',
      organizationId: orgId,
      projectId: null,
      actorId: 'user-1',
      action: 'PROJECT_UPDATED',
      metadata: null,
      previousHash: entry1Hash,
      createdAt: entry2CreatedAt,
    });
    const intactEntries = [
      {
        id: 'log-1',
        organizationId: orgId,
        projectId: null,
        actorId: 'user-1',
        action: 'PROJECT_CREATED',
        metadata: null,
        previousHash: null,
        hash: entry1Hash,
        createdAt: entry1CreatedAt,
      },
      {
        id: 'log-2',
        organizationId: orgId,
        projectId: null,
        actorId: 'user-1',
        action: 'PROJECT_UPDATED',
        metadata: null,
        previousHash: entry1Hash,
        hash: entry2Hash,
        createdAt: entry2CreatedAt,
      },
    ];

    it('reports a valid chain when every entry matches its recomputed hash', async () => {
      prisma.auditLog.findMany.mockResolvedValue(intactEntries);

      const result = await service.verifyChain(orgId);

      expect(result).toEqual({ valid: true, checked: 2, brokenAtId: null });
    });

    it('detects a tampered entry in the chain', async () => {
      prisma.auditLog.findMany.mockResolvedValue([
        intactEntries[0],
        { ...intactEntries[1], action: 'PROJECT_DELETED' },
      ]);

      const result = await service.verifyChain(orgId);

      expect(result.valid).toBe(false);
      expect(result.brokenAtId).toBe('log-2');
    });
  });
});
