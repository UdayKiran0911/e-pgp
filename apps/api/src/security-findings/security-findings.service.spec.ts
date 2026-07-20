import { NotFoundException } from '@nestjs/common';
import { SecurityFindingsService } from './security-findings.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import {
  SecurityFindingSeverity,
  SecurityFindingStatus,
} from '../../generated/prisma/client';

describe('SecurityFindingsService', () => {
  let service: SecurityFindingsService;
  let prisma: {
    project: { findFirst: jest.Mock };
    securityFinding: {
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
  const finding = {
    id: 'finding-1',
    organizationId: orgId,
    projectId: project.id,
    title: 'Outdated TLS cipher suite',
    description: null,
    severity: SecurityFindingSeverity.HIGH,
    status: SecurityFindingStatus.OPEN,
    discoveredAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      securityFinding: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new SecurityFindingsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists findings scoped to an organization, optionally filtered by project', async () => {
    prisma.securityFinding.findMany.mockResolvedValue([finding]);

    const result = await service.findAllInOrganization(orgId, project.id);

    expect(prisma.securityFinding.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: project.id },
      }),
    );
    expect(result).toEqual([finding]);
  });

  it('rejects logging a finding against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        title: finding.title,
        severity: SecurityFindingSeverity.HIGH,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.securityFinding.create).not.toHaveBeenCalled();
  });

  it('logs a finding and writes a SECURITY_FINDING_CREATED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.securityFinding.create.mockResolvedValue(finding);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      title: finding.title,
      severity: SecurityFindingSeverity.HIGH,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'SECURITY_FINDING_CREATED' }),
    );
    expect(result).toEqual(finding);
  });

  it('updates the status and writes a SECURITY_FINDING_STATUS_CHANGED audit log entry', async () => {
    prisma.securityFinding.findFirst.mockResolvedValue(finding);
    prisma.securityFinding.update.mockResolvedValue({
      ...finding,
      status: SecurityFindingStatus.IN_REMEDIATION,
    });

    const result = await service.update(finding.id, orgId, actorId, {
      status: SecurityFindingStatus.IN_REMEDIATION,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'SECURITY_FINDING_STATUS_CHANGED',
        metadata: {
          from: SecurityFindingStatus.OPEN,
          to: SecurityFindingStatus.IN_REMEDIATION,
        },
      }),
    );
    expect(result.status).toBe(SecurityFindingStatus.IN_REMEDIATION);
  });

  it('rejects updating a finding that is not in the caller organization', async () => {
    prisma.securityFinding.findFirst.mockResolvedValue(null);

    await expect(
      service.update(finding.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.securityFinding.update).not.toHaveBeenCalled();
  });
});
