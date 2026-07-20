import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { GovernanceNotifierService } from '../governance-notifier/governance-notifier.service';
import { CreateChangeRequestDto } from './dto/create-change-request.dto';
import { UpdateChangeRequestDto } from './dto/update-change-request.dto';
import { isValidChangeRequestTransition } from './change-request-status';

@Injectable()
export class ChangeRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly governanceNotifier: GovernanceNotifierService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.changeRequest.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const changeRequest = await this.prisma.changeRequest.findFirst({
      where: { id, organizationId },
    });
    if (!changeRequest) {
      throw new NotFoundException('Change request not found.');
    }
    return changeRequest;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateChangeRequestDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const changeRequest = await this.prisma.changeRequest.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        requestedById: actorId,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: changeRequest.projectId,
      actorId,
      action: 'CHANGE_REQUEST_SUBMITTED',
      metadata: { title: changeRequest.title },
    });
    return changeRequest;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateChangeRequestDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    if (
      dto.status &&
      !isValidChangeRequestTransition(existing.status, dto.status)
    ) {
      throw new BadRequestException(
        `Cannot move a change request from ${existing.status} to ${dto.status}.`,
      );
    }

    const changeRequest = await this.prisma.changeRequest.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.auditLog.record({
        organizationId,
        projectId: changeRequest.projectId,
        actorId,
        action: 'CHANGE_REQUEST_STATUS_CHANGED',
        metadata: { from: existing.status, to: dto.status },
      });
      await this.governanceNotifier.notifyDecision({
        organizationId,
        projectId: changeRequest.projectId,
        recipientUserId: existing.requestedById,
        title: `Change request "${changeRequest.title}" is now ${dto.status}`,
        emailSubject: `Change request "${changeRequest.title}" is now ${dto.status}`,
        emailBody: `Change request "${changeRequest.title}" is now ${dto.status}.`,
      });
    }

    return changeRequest;
  }
}
