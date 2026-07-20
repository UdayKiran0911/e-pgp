import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectHealthService } from '../project-health/project-health.service';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface AdoptionCounts {
  total: number;
  last30Days: number;
}

export interface AnalyticsOverview {
  governanceHealth: {
    averageScore: number;
    healthy: number;
    atRisk: number;
    critical: number;
  };
  auditReadiness: {
    gateCompletionRate: number;
    signoffCompletionRate: number;
  };
  adoption: Record<string, AdoptionCounts>;
}

// Analytics (Phase 7 Module 8): rolls up signals already tracked
// elsewhere in the platform into three dashboards — governance health
// (per-project scores from ProjectHealthService), audit readiness (gate/
// sign-off completion rates), and adoption (register usage, total vs.
// last 30 days). No new data model; this is purely a read-side rollup.
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectHealth: ProjectHealthService,
  ) {}

  async getOverview(organizationId: string): Promise<AnalyticsOverview> {
    const [governanceHealth, auditReadiness, adoption] = await Promise.all([
      this.computeGovernanceHealth(organizationId),
      this.computeAuditReadiness(organizationId),
      this.computeAdoption(organizationId),
    ]);
    return { governanceHealth, auditReadiness, adoption };
  }

  private async computeGovernanceHealth(organizationId: string) {
    const projects = await this.prisma.project.findMany({
      where: { organizationId },
      select: { id: true },
    });

    if (projects.length === 0) {
      return { averageScore: 100, healthy: 0, atRisk: 0, critical: 0 };
    }

    const scores = await Promise.all(
      projects.map((p) =>
        this.projectHealth.computeScore(organizationId, p.id),
      ),
    );

    const averageScore = Math.round(
      scores.reduce((sum, s) => sum + s.score, 0) / scores.length,
    );

    return {
      averageScore,
      healthy: scores.filter((s) => s.band === 'HEALTHY').length,
      atRisk: scores.filter((s) => s.band === 'AT_RISK').length,
      critical: scores.filter((s) => s.band === 'CRITICAL').length,
    };
  }

  private async computeAuditReadiness(organizationId: string) {
    const [totalGates, metGates, totalSignoffs, receivedSignoffs] =
      await Promise.all([
        this.prisma.governanceGate.count({ where: { organizationId } }),
        this.prisma.governanceGate.count({
          where: { organizationId, isMet: true },
        }),
        this.prisma.customerSignoff.count({ where: { organizationId } }),
        this.prisma.customerSignoff.count({
          where: { organizationId, status: 'RECEIVED' },
        }),
      ]);

    return {
      gateCompletionRate: totalGates === 0 ? 1 : metGates / totalGates,
      signoffCompletionRate:
        totalSignoffs === 0 ? 1 : receivedSignoffs / totalSignoffs,
    };
  }

  private async computeAdoption(
    organizationId: string,
  ): Promise<Record<string, AdoptionCounts>> {
    const since = new Date(Date.now() - THIRTY_DAYS_MS);

    const [
      risksTotal,
      risksRecent,
      issuesTotal,
      issuesRecent,
      decisionsTotal,
      decisionsRecent,
      requirementsTotal,
      requirementsRecent,
      reviewsTotal,
      reviewsRecent,
      changeRequestsTotal,
      changeRequestsRecent,
      documentsTotal,
      documentsRecent,
      sopsTotal,
      sopsRecent,
      knowledgeArticlesTotal,
      knowledgeArticlesRecent,
      securityFindingsTotal,
      securityFindingsRecent,
    ] = await Promise.all([
      this.prisma.risk.count({ where: { organizationId } }),
      this.prisma.risk.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.issue.count({ where: { organizationId } }),
      this.prisma.issue.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.decision.count({ where: { organizationId } }),
      this.prisma.decision.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.requirement.count({ where: { organizationId } }),
      this.prisma.requirement.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.review.count({ where: { organizationId } }),
      this.prisma.review.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.changeRequest.count({ where: { organizationId } }),
      this.prisma.changeRequest.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.document.count({ where: { organizationId } }),
      this.prisma.document.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.sop.count({ where: { organizationId } }),
      this.prisma.sop.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.knowledgeArticle.count({ where: { organizationId } }),
      this.prisma.knowledgeArticle.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
      this.prisma.securityFinding.count({ where: { organizationId } }),
      this.prisma.securityFinding.count({
        where: { organizationId, createdAt: { gte: since } },
      }),
    ]);

    return {
      risks: { total: risksTotal, last30Days: risksRecent },
      issues: { total: issuesTotal, last30Days: issuesRecent },
      decisions: { total: decisionsTotal, last30Days: decisionsRecent },
      requirements: {
        total: requirementsTotal,
        last30Days: requirementsRecent,
      },
      reviews: { total: reviewsTotal, last30Days: reviewsRecent },
      changeRequests: {
        total: changeRequestsTotal,
        last30Days: changeRequestsRecent,
      },
      documents: { total: documentsTotal, last30Days: documentsRecent },
      sops: { total: sopsTotal, last30Days: sopsRecent },
      knowledgeArticles: {
        total: knowledgeArticlesTotal,
        last30Days: knowledgeArticlesRecent,
      },
      securityFindings: {
        total: securityFindingsTotal,
        last30Days: securityFindingsRecent,
      },
    };
  }
}
