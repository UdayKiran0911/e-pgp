import { NotFoundException } from '@nestjs/common';
import { ProjectHealthService } from './project-health.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectHealthService', () => {
  let service: ProjectHealthService;
  let prisma: {
    project: { findFirst: jest.Mock };
    risk: { count: jest.Mock };
    issue: { count: jest.Mock };
    governanceGate: { count: jest.Mock };
    customerSignoff: { count: jest.Mock };
    deploymentApproval: { count: jest.Mock };
  };

  const orgId = 'org-1';
  const projectId = 'project-1';

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      risk: { count: jest.fn() },
      issue: { count: jest.fn() },
      governanceGate: { count: jest.fn() },
      customerSignoff: { count: jest.fn() },
      deploymentApproval: { count: jest.fn() },
    };
    service = new ProjectHealthService(prisma as unknown as PrismaService);
  });

  function mockAllCounts(counts: Partial<Record<string, number>>) {
    prisma.risk.count.mockResolvedValue(counts.risk ?? 0);
    prisma.issue.count.mockResolvedValue(counts.issue ?? 0);
    prisma.governanceGate.count.mockResolvedValue(counts.gate ?? 0);
    prisma.customerSignoff.count.mockResolvedValue(counts.signoff ?? 0);
    prisma.deploymentApproval.count.mockResolvedValue(counts.deployment ?? 0);
  }

  it('rejects computing a score for a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(service.computeScore(orgId, projectId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('scores a clean project 100 and HEALTHY', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: projectId,
      organizationId: orgId,
    });
    mockAllCounts({});

    const result = await service.computeScore(orgId, projectId);

    expect(result.score).toBe(100);
    expect(result.band).toBe('HEALTHY');
  });

  it('drops into AT_RISK once deductions cross the healthy threshold', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: projectId,
      organizationId: orgId,
    });
    mockAllCounts({ risk: 3 }); // 3 * 8 = 24 -> score 76

    const result = await service.computeScore(orgId, projectId);

    expect(result.score).toBe(76);
    expect(result.band).toBe('AT_RISK');
  });

  it('drops into CRITICAL once deductions cross the at-risk threshold', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: projectId,
      organizationId: orgId,
    });
    mockAllCounts({ risk: 3, issue: 3, deployment: 2 }); // 24 + 24 + 20 = 68 -> score 32

    const result = await service.computeScore(orgId, projectId);

    expect(result.score).toBe(32);
    expect(result.band).toBe('CRITICAL');
  });

  it('never goes below 0 even with very heavy deductions', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: projectId,
      organizationId: orgId,
    });
    mockAllCounts({
      risk: 20,
      issue: 20,
      gate: 20,
      signoff: 20,
      deployment: 20,
    });

    const result = await service.computeScore(orgId, projectId);

    expect(result.score).toBe(0);
    expect(result.band).toBe('CRITICAL');
  });

  it('reports the raw signal counts alongside the score', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: projectId,
      organizationId: orgId,
    });
    mockAllCounts({ risk: 1, issue: 2, gate: 3, signoff: 4, deployment: 5 });

    const result = await service.computeScore(orgId, projectId);

    expect(result.signals).toEqual({
      openHighCriticalRisks: 1,
      unresolvedHighCriticalIssues: 2,
      unmetGovernanceGates: 3,
      pendingCustomerSignoffs: 4,
      blockedDeployments: 5,
    });
  });
});
