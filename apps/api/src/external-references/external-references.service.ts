import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateExternalReferenceDto } from './dto/create-external-reference.dto';

@Injectable()
export class ExternalReferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAllForIssue(issueId: string, organizationId: string) {
    const issue = await this.prisma.issue.findFirst({
      where: { id: issueId, organizationId },
    });
    if (!issue) {
      throw new NotFoundException('Issue not found.');
    }
    return this.prisma.externalReference.findMany({
      where: { issueId, organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateExternalReferenceDto,
  ) {
    const issue = await this.prisma.issue.findFirst({
      where: { id: dto.issueId, organizationId },
    });
    if (!issue) {
      throw new NotFoundException('Issue not found.');
    }

    const reference = await this.prisma.externalReference.create({
      data: {
        organizationId,
        issueId: dto.issueId,
        provider: dto.provider,
        externalId: dto.externalId,
        url: dto.url,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: issue.projectId,
      actorId,
      action: 'EXTERNAL_REFERENCE_LINKED',
      metadata: {
        issueId: dto.issueId,
        provider: dto.provider,
        externalId: dto.externalId,
      },
    });
    return reference;
  }

  async remove(id: string, organizationId: string, actorId: string) {
    const reference = await this.prisma.externalReference.findFirst({
      where: { id, organizationId },
      include: { issue: { select: { projectId: true } } },
    });
    if (!reference) {
      throw new NotFoundException('External reference not found.');
    }
    await this.prisma.externalReference.delete({ where: { id } });
    await this.auditLog.record({
      organizationId,
      projectId: reference.issue.projectId,
      actorId,
      action: 'EXTERNAL_REFERENCE_UNLINKED',
      metadata: { issueId: reference.issueId, provider: reference.provider },
    });
  }
}
