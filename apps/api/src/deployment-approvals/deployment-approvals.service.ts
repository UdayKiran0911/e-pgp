import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { GovernanceNotifierService } from '../governance-notifier/governance-notifier.service';
import { CreateDeploymentApprovalDto } from './dto/create-deployment-approval.dto';
import { UpdateDeploymentApprovalDto } from './dto/update-deployment-approval.dto';
import { isValidDeploymentTransition } from './deployment-status';
import { DeploymentStatus, SignoffStatus } from '../../generated/prisma/client';

@Injectable()
export class DeploymentApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly governanceNotifier: GovernanceNotifierService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.deploymentApproval.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const approval = await this.prisma.deploymentApproval.findFirst({
      where: { id, organizationId },
    });
    if (!approval) {
      throw new NotFoundException('Deployment approval not found.');
    }
    return approval;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateDeploymentApprovalDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const approval = await this.prisma.deploymentApproval.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        notes: dto.notes,
        requestedById: actorId,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: approval.projectId,
      actorId,
      action: 'DEPLOYMENT_APPROVAL_REQUESTED',
      metadata: { title: approval.title },
    });
    return approval;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateDeploymentApprovalDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    if (
      dto.status &&
      !isValidDeploymentTransition(existing.status, dto.status)
    ) {
      throw new BadRequestException(
        `Cannot move a deployment approval from ${existing.status} to ${dto.status}.`,
      );
    }

    if (dto.status === DeploymentStatus.APPROVED) {
      await this.assertGovernanceReady(organizationId, existing.projectId);
    }

    const approval = await this.prisma.deploymentApproval.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.auditLog.record({
        organizationId,
        projectId: approval.projectId,
        actorId,
        action: 'DEPLOYMENT_APPROVAL_STATUS_CHANGED',
        metadata: { from: existing.status, to: dto.status },
      });
      await this.governanceNotifier.notifyDecision({
        organizationId,
        projectId: approval.projectId,
        recipientUserId: existing.requestedById,
        title:
          dto.status === DeploymentStatus.APPROVED
            ? `Deployment "${approval.title}" approved`
            : `Deployment "${approval.title}" blocked`,
        body: dto.status === DeploymentStatus.BLOCKED ? dto.notes : undefined,
        emailSubject:
          dto.status === DeploymentStatus.APPROVED
            ? `Deployment "${approval.title}" approved`
            : `Deployment "${approval.title}" blocked`,
        emailBody:
          dto.status === DeploymentStatus.BLOCKED && dto.notes
            ? dto.notes
            : `Deployment "${approval.title}" is now ${dto.status}.`,
      });
    }

    return approval;
  }

  // Enforces "block deployment record until required sign-offs exist"
  // (Phase 6 Module 12) — every governance gate on the project must be met
  // and every customer sign-off must be RECEIVED. Vacuously satisfied if a
  // project has neither, so the check never blocks a project that hasn't
  // adopted those registers.
  private async assertGovernanceReady(
    organizationId: string,
    projectId: string,
  ) {
    const [unmetGates, unreceivedSignoffs] = await Promise.all([
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
    ]);
    if (unmetGates > 0 || unreceivedSignoffs > 0) {
      throw new BadRequestException(
        `Cannot approve deployment: ${unmetGates} governance gate(s) unmet, ${unreceivedSignoffs} customer sign-off(s) not received.`,
      );
    }
  }
}
