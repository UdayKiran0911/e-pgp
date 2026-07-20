import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateSecurityFindingDto } from './dto/create-security-finding.dto';
import { UpdateSecurityFindingDto } from './dto/update-security-finding.dto';

@Injectable()
export class SecurityFindingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.securityFinding.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const finding = await this.prisma.securityFinding.findFirst({
      where: { id, organizationId },
    });
    if (!finding) {
      throw new NotFoundException('Security finding not found.');
    }
    return finding;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateSecurityFindingDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const finding = await this.prisma.securityFinding.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
        severity: dto.severity,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: finding.projectId,
      actorId,
      action: 'SECURITY_FINDING_CREATED',
      metadata: { title: finding.title, severity: finding.severity },
    });
    return finding;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateSecurityFindingDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const finding = await this.prisma.securityFinding.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.auditLog.record({
        organizationId,
        projectId: finding.projectId,
        actorId,
        action: 'SECURITY_FINDING_STATUS_CHANGED',
        metadata: { from: existing.status, to: dto.status },
      });
    }

    return finding;
  }
}
