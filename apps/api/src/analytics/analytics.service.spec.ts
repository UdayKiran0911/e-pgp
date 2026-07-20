import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectHealthService } from '../project-health/project-health.service';

function countDelegate(total: number, recent = 0) {
  return {
    count: jest
      .fn()
      .mockImplementation((args: { where: { createdAt?: unknown } }) =>
        Promise.resolve(args.where.createdAt ? recent : total),
      ),
  };
}

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: Record<string, { count?: jest.Mock; findMany?: jest.Mock }>;
  let projectHealth: { computeScore: jest.Mock };

  const orgId = 'org-1';

  beforeEach(() => {
    prisma = {
      project: { findMany: jest.fn().mockResolvedValue([]) },
      governanceGate: countDelegate(0),
      customerSignoff: countDelegate(0),
      risk: countDelegate(0),
      issue: countDelegate(0),
      decision: countDelegate(0),
      requirement: countDelegate(0),
      review: countDelegate(0),
      changeRequest: countDelegate(0),
      document: countDelegate(0),
      sop: countDelegate(0),
      knowledgeArticle: countDelegate(0),
      securityFinding: countDelegate(0),
    };
    projectHealth = { computeScore: jest.fn() };
    service = new AnalyticsService(
      prisma as unknown as PrismaService,
      projectHealth as unknown as ProjectHealthService,
    );
  });

  it('reports 100% completion rates when there are no gates or sign-offs yet', async () => {
    const result = await service.getOverview(orgId);

    expect(result.auditReadiness).toEqual({
      gateCompletionRate: 1,
      signoffCompletionRate: 1,
    });
  });

  it('computes gate and sign-off completion rates from counts', async () => {
    prisma.governanceGate = {
      count: jest
        .fn()
        .mockImplementation((args: { where: { isMet?: boolean } }) =>
          Promise.resolve(args.where.isMet ? 3 : 4),
        ),
    };
    prisma.customerSignoff = {
      count: jest
        .fn()
        .mockImplementation((args: { where: { status?: string } }) =>
          Promise.resolve(args.where.status ? 1 : 2),
        ),
    };

    const result = await service.getOverview(orgId);

    expect(result.auditReadiness.gateCompletionRate).toBe(0.75);
    expect(result.auditReadiness.signoffCompletionRate).toBe(0.5);
  });

  it('reports a perfect governance health score when there are no projects', async () => {
    const result = await service.getOverview(orgId);

    expect(result.governanceHealth).toEqual({
      averageScore: 100,
      healthy: 0,
      atRisk: 0,
      critical: 0,
    });
  });

  it('averages per-project health scores and buckets them into bands', async () => {
    prisma.project = {
      findMany: jest
        .fn()
        .mockResolvedValue([{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }]),
    };
    projectHealth.computeScore
      .mockResolvedValueOnce({ projectId: 'p1', score: 100, band: 'HEALTHY' })
      .mockResolvedValueOnce({ projectId: 'p2', score: 60, band: 'AT_RISK' })
      .mockResolvedValueOnce({ projectId: 'p3', score: 20, band: 'CRITICAL' });

    const result = await service.getOverview(orgId);

    expect(result.governanceHealth).toEqual({
      averageScore: 60,
      healthy: 1,
      atRisk: 1,
      critical: 1,
    });
  });

  it('reports total and last-30-days adoption counts per register', async () => {
    prisma.risk = countDelegate(10, 2);

    const result = await service.getOverview(orgId);

    expect(result.adoption.risks).toEqual({ total: 10, last30Days: 2 });
  });
});
