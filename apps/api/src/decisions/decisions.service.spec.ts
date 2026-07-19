import { NotFoundException } from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

describe('DecisionsService', () => {
  let service: DecisionsService;
  let prisma: {
    project: { findFirst: jest.Mock };
    decision: {
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
  const decision = {
    id: 'decision-1',
    organizationId: orgId,
    projectId: project.id,
    title: 'Adopt Postgres over MySQL',
    context: 'Need JSON columns and better tooling',
    decision: 'Go with Postgres',
    decidedById: actorId,
    decidedAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      decision: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new DecisionsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists decisions scoped to an organization, optionally filtered by project', async () => {
    prisma.decision.findMany.mockResolvedValue([decision]);

    const result = await service.findAllInOrganization(orgId, project.id);

    expect(prisma.decision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: project.id },
      }),
    );
    expect(result).toEqual([decision]);
  });

  it('rejects logging a decision against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        title: decision.title,
        decision: decision.decision,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.decision.create).not.toHaveBeenCalled();
  });

  it('creates a decision and writes a DECISION_LOGGED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.decision.create.mockResolvedValue(decision);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      title: decision.title,
      decision: decision.decision,
    });

    expect(prisma.decision.create).toHaveBeenCalledWith({
      data: {
        organizationId: orgId,
        projectId: project.id,
        title: decision.title,
        context: undefined,
        decision: decision.decision,
        decidedById: actorId,
      },
    });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: project.id,
        actorId,
        action: 'DECISION_LOGGED',
      }),
    );
    expect(result).toEqual(decision);
  });

  it('updates a decision and writes a DECISION_UPDATED audit log entry', async () => {
    prisma.decision.findFirst.mockResolvedValue(decision);
    prisma.decision.update.mockResolvedValue({
      ...decision,
      title: 'Adopt Postgres over MySQL (revised)',
    });

    const result = await service.update(decision.id, orgId, actorId, {
      title: 'Adopt Postgres over MySQL (revised)',
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: decision.projectId,
        actorId,
        action: 'DECISION_UPDATED',
      }),
    );
    expect(result.title).toBe('Adopt Postgres over MySQL (revised)');
  });

  it('rejects updating a decision that is not in the caller organization', async () => {
    prisma.decision.findFirst.mockResolvedValue(null);

    await expect(
      service.update(decision.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.decision.update).not.toHaveBeenCalled();
  });
});
