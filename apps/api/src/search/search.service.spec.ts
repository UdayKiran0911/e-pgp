import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

function emptyFindMany() {
  return jest.fn().mockResolvedValue([]);
}

describe('SearchService', () => {
  let service: SearchService;
  let prisma: {
    risk: { findMany: jest.Mock };
    issue: { findMany: jest.Mock };
    decision: { findMany: jest.Mock };
    changeRequest: { findMany: jest.Mock };
    requirement: { findMany: jest.Mock };
    review: { findMany: jest.Mock };
    document: { findMany: jest.Mock };
    sop: { findMany: jest.Mock };
    knowledgeArticle: { findMany: jest.Mock };
    department: { findMany: jest.Mock };
    customerSignoff: { findMany: jest.Mock };
  };

  const orgId = 'org-1';

  beforeEach(() => {
    prisma = {
      risk: { findMany: emptyFindMany() },
      issue: { findMany: emptyFindMany() },
      decision: { findMany: emptyFindMany() },
      changeRequest: { findMany: emptyFindMany() },
      requirement: { findMany: emptyFindMany() },
      review: { findMany: emptyFindMany() },
      document: { findMany: emptyFindMany() },
      sop: { findMany: emptyFindMany() },
      knowledgeArticle: { findMany: emptyFindMany() },
      department: { findMany: emptyFindMany() },
      customerSignoff: { findMany: emptyFindMany() },
    };
    service = new SearchService(prisma as unknown as PrismaService);
  });

  it('returns an empty result set for a blank or too-short query without hitting the database', async () => {
    expect(await service.search(orgId, '')).toEqual([]);
    expect(await service.search(orgId, 'a')).toEqual([]);
    expect(prisma.risk.findMany).not.toHaveBeenCalled();
  });

  it('queries every register scoped to the organization, case-insensitively', async () => {
    await service.search(orgId, 'outage');

    expect(prisma.risk.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: orgId,
          title: { contains: 'outage', mode: 'insensitive' },
        },
      }),
    );
    expect(prisma.sop.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: orgId,
          OR: [
            { title: { contains: 'outage', mode: 'insensitive' } },
            { content: { contains: 'outage', mode: 'insensitive' } },
          ],
        },
      }),
    );
  });

  it('maps matches into a flat, typed result list with truncated snippets', async () => {
    prisma.risk.findMany.mockResolvedValue([
      {
        id: 'risk-1',
        title: 'Payment gateway outage risk',
        projectId: 'project-1',
        description: 'x'.repeat(300),
      },
    ]);

    const results = await service.search(orgId, 'outage');

    expect(results).toEqual([
      {
        type: 'Risk',
        id: 'risk-1',
        title: 'Payment gateway outage risk',
        projectId: 'project-1',
        snippet: 'x'.repeat(160),
      },
    ]);
  });
});
