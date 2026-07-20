import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RiskSeverity,
  RiskStatus,
  IssuePriority,
  IssueStatus,
  SignoffStatus,
  DeploymentStatus,
} from '../../generated/prisma/client';

export type ProjectHealthBand = 'HEALTHY' | 'AT_RISK' | 'CRITICAL';

export interface ProjectHealthScore {
  projectId: string;
  score: number;
  band: ProjectHealthBand;
  signals: {
    openHighCriticalRisks: number;
    unresolvedHighCriticalIssues: number;
    unmetGovernanceGates: number;
    pendingCustomerSignoffs: number;
    blockedDeployments: number;
  };
}

const DEDUCTIONS = {
  openHighCriticalRisk: 8,
  unresolvedHighCriticalIssue: 8,
  unmetGovernanceGate: 5,
  pendingCustomerSignoff: 5,
  blockedDeployment: 10,
};

// AI Risk Prediction (Phase 7 Module 4), simplified: a heuristic health
// score computed from signals already tracked elsewhere in the platform
// (open high/critical risks, unresolved high/critical issues, unmet
// governance gates, pending customer sign-offs, blocked deployments)
// rather than a trained predictive model. A real ML-based predictor is a
// separate decision, deliberately not made here.
@Injectable()
export class ProjectHealthService {
  constructor(private readonly prisma: PrismaService) {}

  async computeScore(
    organizationId: string,
    projectId: string,
  ): Promise<ProjectHealthScore> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const [
      openHighCriticalRisks,
      unresolvedHighCriticalIssues,
      unmetGovernanceGates,
      pendingCustomerSignoffs,
      blockedDeployments,
    ] = await Promise.all([
      this.prisma.risk.count({
        where: {
          organizationId,
          projectId,
          status: RiskStatus.OPEN,
          severity: { in: [RiskSeverity.HIGH, RiskSeverity.CRITICAL] },
        },
      }),
      this.prisma.issue.count({
        where: {
          organizationId,
          projectId,
          status: { not: IssueStatus.CLOSED },
          priority: { in: [IssuePriority.HIGH, IssuePriority.CRITICAL] },
        },
      }),
      this.prisma.governanceGate.count({
        where: { organizationId, projectId, isMet: false },
      }),
      this.prisma.customerSignoff.count({
        where: {
          organizationId,
          projectId,
          status: { not: SignoffStatus.RECEIVED },
        },
      }),
      this.prisma.deploymentApproval.count({
        where: { organizationId, projectId, status: DeploymentStatus.BLOCKED },
      }),
    ]);

    const deductions =
      openHighCriticalRisks * DEDUCTIONS.openHighCriticalRisk +
      unresolvedHighCriticalIssues * DEDUCTIONS.unresolvedHighCriticalIssue +
      unmetGovernanceGates * DEDUCTIONS.unmetGovernanceGate +
      pendingCustomerSignoffs * DEDUCTIONS.pendingCustomerSignoff +
      blockedDeployments * DEDUCTIONS.blockedDeployment;

    const score = Math.max(0, Math.min(100, 100 - deductions));
    const band: ProjectHealthBand =
      score >= 80 ? 'HEALTHY' : score >= 50 ? 'AT_RISK' : 'CRITICAL';

    return {
      projectId,
      score,
      band,
      signals: {
        openHighCriticalRisks,
        unresolvedHighCriticalIssues,
        unmetGovernanceGates,
        pendingCustomerSignoffs,
        blockedDeployments,
      },
    };
  }
}
