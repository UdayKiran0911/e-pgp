import { NotFoundException } from '@nestjs/common';
import { GovernanceGatesService } from './governance-gates.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { GateCategory } from '../../generated/prisma/client';

describe('GovernanceGatesService', () => {
  let service: GovernanceGatesService;
  let prisma: {
    project: { findFirst: jest.Mock };
    governanceGate: {
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
  const gate = {
    id: 'gate-1',
    organizationId: orgId,
    projectId: project.id,
    category: GateCategory.DEVELOPMENT,
    title: 'Code review completed',
    isMet: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      governanceGate: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new GovernanceGatesService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists gates scoped to an organization, optionally filtered by project', async () => {
    prisma.governanceGate.findMany.mockResolvedValue([gate]);

    const result = await service.findAllInOrganization(orgId, project.id);

    expect(prisma.governanceGate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: project.id },
      }),
    );
    expect(result).toEqual([gate]);
  });

  it('rejects adding a gate against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        category: GateCategory.DEVELOPMENT,
        title: gate.title,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.governanceGate.create).not.toHaveBeenCalled();
  });

  it('adds a gate and writes a GOVERNANCE_GATE_ADDED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.governanceGate.create.mockResolvedValue(gate);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      category: GateCategory.DEVELOPMENT,
      title: gate.title,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: project.id,
        actorId,
        action: 'GOVERNANCE_GATE_ADDED',
      }),
    );
    expect(result).toEqual(gate);
  });

  it('marks a gate met and writes a GOVERNANCE_GATE_TOGGLED audit log entry', async () => {
    prisma.governanceGate.findFirst.mockResolvedValue(gate);
    prisma.governanceGate.update.mockResolvedValue({ ...gate, isMet: true });

    const result = await service.update(gate.id, orgId, actorId, {
      isMet: true,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: gate.projectId,
        actorId,
        action: 'GOVERNANCE_GATE_TOGGLED',
        metadata: { title: gate.title, isMet: true },
      }),
    );
    expect(result.isMet).toBe(true);
  });

  it('rejects updating a gate that is not in the caller organization', async () => {
    prisma.governanceGate.findFirst.mockResolvedValue(null);

    await expect(
      service.update(gate.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.governanceGate.update).not.toHaveBeenCalled();
  });
});
