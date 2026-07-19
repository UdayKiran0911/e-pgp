import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateGovernanceGateDto } from './dto/create-governance-gate.dto';
import { UpdateGovernanceGateDto } from './dto/update-governance-gate.dto';

@Injectable()
export class GovernanceGatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.governanceGate.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const gate = await this.prisma.governanceGate.findFirst({
      where: { id, organizationId },
    });
    if (!gate) {
      throw new NotFoundException('Governance gate not found.');
    }
    return gate;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateGovernanceGateDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const gate = await this.prisma.governanceGate.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        category: dto.category,
        title: dto.title,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: gate.projectId,
      actorId,
      action: 'GOVERNANCE_GATE_ADDED',
      metadata: { title: gate.title, category: gate.category },
    });
    return gate;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateGovernanceGateDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const gate = await this.prisma.governanceGate.update({
      where: { id },
      data: dto,
    });

    if (dto.isMet !== undefined && dto.isMet !== existing.isMet) {
      await this.auditLog.record({
        organizationId,
        projectId: gate.projectId,
        actorId,
        action: 'GOVERNANCE_GATE_TOGGLED',
        metadata: { title: gate.title, isMet: gate.isMet },
      });
    }

    return gate;
  }
}
