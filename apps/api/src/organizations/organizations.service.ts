import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found.');
    }
    return organization;
  }

  async update(id: string, actorId: string, dto: UpdateOrganizationDto) {
    const existing = await this.findOne(id);

    const organization = await this.prisma.organization.update({
      where: { id },
      data: { name: dto.name },
    });

    if (dto.name !== existing.name) {
      await this.auditLog.record({
        organizationId: id,
        actorId,
        action: 'ORGANIZATION_UPDATED',
        metadata: { from: existing.name, to: dto.name },
      });
    }

    return organization;
  }

  // Backup & Recovery (Phase 9), simplified: an on-demand JSON snapshot of
  // the organization's core data rather than a scheduled backup/restore
  // pipeline (that's a real infra decision — provider, retention, restore
  // tooling — deliberately not made here). ADMIN-only, audit-logged.
  async exportData(organizationId: string, actorId: string) {
    const [
      organization,
      users,
      projects,
      risks,
      issues,
      decisions,
      requirements,
      reviews,
      changeRequests,
      checklistItems,
      documents,
      governanceGates,
      customerSignoffs,
      deploymentApprovals,
      departments,
      sops,
      knowledgeArticles,
      securityFindings,
    ] = await Promise.all([
      this.findOne(organizationId),
      this.prisma.user.findMany({
        where: { organizationId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.prisma.project.findMany({ where: { organizationId } }),
      this.prisma.risk.findMany({ where: { organizationId } }),
      this.prisma.issue.findMany({ where: { organizationId } }),
      this.prisma.decision.findMany({ where: { organizationId } }),
      this.prisma.requirement.findMany({ where: { organizationId } }),
      this.prisma.review.findMany({ where: { organizationId } }),
      this.prisma.changeRequest.findMany({ where: { organizationId } }),
      this.prisma.checklistItem.findMany({ where: { organizationId } }),
      this.prisma.document.findMany({ where: { organizationId } }),
      this.prisma.governanceGate.findMany({ where: { organizationId } }),
      this.prisma.customerSignoff.findMany({ where: { organizationId } }),
      this.prisma.deploymentApproval.findMany({ where: { organizationId } }),
      this.prisma.department.findMany({ where: { organizationId } }),
      this.prisma.sop.findMany({ where: { organizationId } }),
      this.prisma.knowledgeArticle.findMany({ where: { organizationId } }),
      this.prisma.securityFinding.findMany({ where: { organizationId } }),
    ]);

    await this.auditLog.record({
      organizationId,
      actorId,
      action: 'ORGANIZATION_DATA_EXPORTED',
      metadata: { projectCount: projects.length, userCount: users.length },
    });

    return {
      exportedAt: new Date().toISOString(),
      organization,
      users,
      projects,
      risks,
      issues,
      decisions,
      requirements,
      reviews,
      changeRequests,
      checklistItems,
      documents,
      governanceGates,
      customerSignoffs,
      deploymentApprovals,
      departments,
      sops,
      knowledgeArticles,
      securityFindings,
    };
  }
}
