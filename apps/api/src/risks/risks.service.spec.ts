import { NotFoundException } from '@nestjs/common';
import { RisksService } from './risks.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import {
  RiskLikelihood,
  RiskSeverity,
  RiskStatus,
} from '../../generated/prisma/client';

describe('RisksService', () => {
  let service: RisksService;
  let prisma: {
    project: { findFirst: jest.Mock };
    risk: {
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
  const risk = {
    id: 'risk-1',
    organizationId: orgId,
    projectId: project.id,
    title: 'Vendor lock-in',
    description: null,
    severity: RiskSeverity.HIGH,
    likelihood: RiskLikelihood.MEDIUM,
    status: RiskStatus.OPEN,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      risk: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new RisksService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists risks scoped to an organization, optionally filtered by project', async () => {
    prisma.risk.findMany.mockResolvedValue([risk]);

    const result = await service.findAllInOrganization(orgId, project.id);

    expect(prisma.risk.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: project.id },
      }),
    );
    expect(result).toEqual([risk]);
  });

  it('rejects creating a risk against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        title: risk.title,
        severity: RiskSeverity.HIGH,
        likelihood: RiskLikelihood.MEDIUM,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.risk.create).not.toHaveBeenCalled();
  });

  it('creates a risk and writes a RISK_CREATED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.risk.create.mockResolvedValue(risk);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      title: risk.title,
      severity: RiskSeverity.HIGH,
      likelihood: RiskLikelihood.MEDIUM,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: project.id,
        actorId,
        action: 'RISK_CREATED',
      }),
    );
    expect(result).toEqual(risk);
  });

  it('updates the status and writes a RISK_STATUS_CHANGED audit log entry', async () => {
    prisma.risk.findFirst.mockResolvedValue(risk);
    prisma.risk.update.mockResolvedValue({
      ...risk,
      status: RiskStatus.MITIGATED,
    });

    const result = await service.update(risk.id, orgId, actorId, {
      status: RiskStatus.MITIGATED,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: risk.projectId,
        actorId,
        action: 'RISK_STATUS_CHANGED',
        metadata: { from: RiskStatus.OPEN, to: RiskStatus.MITIGATED },
      }),
    );
    expect(result.status).toBe(RiskStatus.MITIGATED);
  });

  it('does not write an audit log entry when status is unchanged', async () => {
    prisma.risk.findFirst.mockResolvedValue(risk);
    prisma.risk.update.mockResolvedValue({ ...risk, description: 'Updated' });

    await service.update(risk.id, orgId, actorId, {
      description: 'Updated',
    });

    expect(auditLog.record).not.toHaveBeenCalled();
  });

  it('rejects updating a risk that is not in the caller organization', async () => {
    prisma.risk.findFirst.mockResolvedValue(null);

    await expect(
      service.update(risk.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.risk.update).not.toHaveBeenCalled();
  });
});
