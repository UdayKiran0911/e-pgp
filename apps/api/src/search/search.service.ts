import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  projectId: string | null;
  snippet: string | null;
}

const RESULT_LIMIT_PER_TYPE = 5;
const SNIPPET_LENGTH = 160;

// Enterprise Search (Phase 7), simplified: rather than a dedicated search
// index/infra decision, this aggregates a case-insensitive `contains`
// query across every text-bearing register already in the platform. Good
// enough to find things by keyword; a real full-text/ranked search engine
// is a separate infra decision, deliberately not made here.
@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(organizationId: string, query: string): Promise<SearchResult[]> {
    const q = query?.trim();
    if (!q || q.length < 2) {
      return [];
    }
    const contains = { contains: q, mode: 'insensitive' as const };

    const [
      risks,
      issues,
      decisions,
      changeRequests,
      requirements,
      reviews,
      documents,
      sops,
      articles,
      departments,
      customerSignoffs,
    ] = await Promise.all([
      this.prisma.risk.findMany({
        where: { organizationId, title: contains },
        take: RESULT_LIMIT_PER_TYPE,
      }),
      this.prisma.issue.findMany({
        where: { organizationId, title: contains },
        take: RESULT_LIMIT_PER_TYPE,
      }),
      this.prisma.decision.findMany({
        where: { organizationId, title: contains },
        take: RESULT_LIMIT_PER_TYPE,
      }),
      this.prisma.changeRequest.findMany({
        where: { organizationId, title: contains },
        take: RESULT_LIMIT_PER_TYPE,
      }),
      this.prisma.requirement.findMany({
        where: { organizationId, title: contains },
        take: RESULT_LIMIT_PER_TYPE,
      }),
      this.prisma.review.findMany({
        where: { organizationId, title: contains },
        take: RESULT_LIMIT_PER_TYPE,
      }),
      this.prisma.document.findMany({
        where: { organizationId, title: contains },
        take: RESULT_LIMIT_PER_TYPE,
      }),
      this.prisma.sop.findMany({
        where: {
          organizationId,
          OR: [{ title: contains }, { content: contains }],
        },
        take: RESULT_LIMIT_PER_TYPE,
      }),
      this.prisma.knowledgeArticle.findMany({
        where: {
          organizationId,
          OR: [{ title: contains }, { content: contains }],
        },
        take: RESULT_LIMIT_PER_TYPE,
      }),
      this.prisma.department.findMany({
        where: { organizationId, name: contains },
        take: RESULT_LIMIT_PER_TYPE,
      }),
      this.prisma.customerSignoff.findMany({
        where: { organizationId, title: contains },
        take: RESULT_LIMIT_PER_TYPE,
      }),
    ]);

    return [
      ...risks.map((r) =>
        this.toResult('Risk', r.id, r.title, r.projectId, r.description),
      ),
      ...issues.map((r) =>
        this.toResult('Issue', r.id, r.title, r.projectId, r.description),
      ),
      ...decisions.map((r) =>
        this.toResult('Decision', r.id, r.title, r.projectId, r.decision),
      ),
      ...changeRequests.map((r) =>
        this.toResult(
          'Change Request',
          r.id,
          r.title,
          r.projectId,
          r.description,
        ),
      ),
      ...requirements.map((r) =>
        this.toResult('Requirement', r.id, r.title, r.projectId, r.description),
      ),
      ...reviews.map((r) =>
        this.toResult('Review', r.id, r.title, r.projectId, r.description),
      ),
      ...documents.map((r) =>
        this.toResult('Document', r.id, r.title, r.projectId, r.url),
      ),
      ...sops.map((r) => this.toResult('SOP', r.id, r.title, null, r.content)),
      ...articles.map((r) =>
        this.toResult('Knowledge Article', r.id, r.title, null, r.content),
      ),
      ...departments.map((r) =>
        this.toResult('Department', r.id, r.name, null, null),
      ),
      ...customerSignoffs.map((r) =>
        this.toResult(
          'Customer Sign-off',
          r.id,
          r.title,
          r.projectId,
          r.customerName,
        ),
      ),
    ];
  }

  private toResult(
    type: string,
    id: string,
    title: string,
    projectId: string | null,
    snippetSource: string | null | undefined,
  ): SearchResult {
    return {
      type,
      id,
      title,
      projectId: projectId ?? null,
      snippet: snippetSource ? snippetSource.slice(0, SNIPPET_LENGTH) : null,
    };
  }
}
