import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateKnowledgeArticleDto } from './dto/create-knowledge-article.dto';
import { UpdateKnowledgeArticleDto } from './dto/update-knowledge-article.dto';

@Injectable()
export class KnowledgeArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, category?: string) {
    return this.prisma.knowledgeArticle.findMany({
      where: { organizationId, ...(category ? { category } : {}) },
      orderBy: { title: 'asc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const article = await this.prisma.knowledgeArticle.findFirst({
      where: { id, organizationId },
    });
    if (!article) {
      throw new NotFoundException('Knowledge article not found.');
    }
    return article;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateKnowledgeArticleDto,
  ) {
    const article = await this.prisma.knowledgeArticle.create({
      data: {
        organizationId,
        title: dto.title,
        category: dto.category,
        tags: dto.tags ?? [],
        content: dto.content,
      },
    });
    await this.auditLog.record({
      organizationId,
      actorId,
      action: 'KNOWLEDGE_ARTICLE_CREATED',
      metadata: { title: article.title, category: article.category },
    });
    return article;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateKnowledgeArticleDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const article = await this.prisma.knowledgeArticle.update({
      where: { id },
      data: dto,
    });

    await this.auditLog.record({
      organizationId,
      actorId,
      action: 'KNOWLEDGE_ARTICLE_UPDATED',
      metadata: { title: existing.title },
    });

    return article;
  }
}
