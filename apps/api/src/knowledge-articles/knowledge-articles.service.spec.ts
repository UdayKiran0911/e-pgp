import { NotFoundException } from '@nestjs/common';
import { KnowledgeArticlesService } from './knowledge-articles.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

describe('KnowledgeArticlesService', () => {
  let service: KnowledgeArticlesService;
  let prisma: {
    knowledgeArticle: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditLog: { record: jest.Mock };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const article = {
    id: 'article-1',
    organizationId: orgId,
    title: 'Post-incident Retro: Payment Outage',
    category: 'Retrospective',
    tags: ['incidents', 'payments'],
    content: 'Root cause was...',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      knowledgeArticle: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new KnowledgeArticlesService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists articles scoped to an organization, optionally filtered by category', async () => {
    prisma.knowledgeArticle.findMany.mockResolvedValue([article]);

    const result = await service.findAllInOrganization(orgId, 'Retrospective');

    expect(prisma.knowledgeArticle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, category: 'Retrospective' },
      }),
    );
    expect(result).toEqual([article]);
  });

  it('creates an article, defaulting tags to an empty array, and writes a KNOWLEDGE_ARTICLE_CREATED audit log entry', async () => {
    prisma.knowledgeArticle.create.mockResolvedValue({ ...article, tags: [] });

    const result = await service.create(orgId, actorId, {
      title: article.title,
      category: article.category,
      content: article.content,
    });

    const createCall = prisma.knowledgeArticle.create.mock.calls[0][0] as {
      data: { tags: string[] };
    };
    expect(createCall.data.tags).toEqual([]);
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'KNOWLEDGE_ARTICLE_CREATED' }),
    );
    expect(result.tags).toEqual([]);
  });

  it('updates an article and writes a KNOWLEDGE_ARTICLE_UPDATED audit log entry', async () => {
    prisma.knowledgeArticle.findFirst.mockResolvedValue(article);
    prisma.knowledgeArticle.update.mockResolvedValue({
      ...article,
      content: 'Updated root cause',
    });

    const result = await service.update(article.id, orgId, actorId, {
      content: 'Updated root cause',
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'KNOWLEDGE_ARTICLE_UPDATED' }),
    );
    expect(result.content).toBe('Updated root cause');
  });

  it('rejects updating an article that is not in the caller organization', async () => {
    prisma.knowledgeArticle.findFirst.mockResolvedValue(null);

    await expect(
      service.update(article.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.knowledgeArticle.update).not.toHaveBeenCalled();
  });
});
