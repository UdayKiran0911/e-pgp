import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { RequirementStatus } from '../../generated/prisma/client';

export interface RequirementAnalysis {
  requirementId: string;
  title: string;
  flags: string[];
}

// A stale DRAFT is one that's been sitting unreviewed for a while — long
// enough that it's worth flagging as needing attention.
const STALE_DRAFT_DAYS = 30;
const MIN_TITLE_LENGTH = 10;

@Injectable()
export class RequirementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.requirement.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const requirement = await this.prisma.requirement.findFirst({
      where: { id, organizationId },
    });
    if (!requirement) {
      throw new NotFoundException('Requirement not found.');
    }
    return requirement;
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateRequirementDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const requirement = await this.prisma.requirement.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        title: dto.title,
        description: dto.description,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: requirement.projectId,
      actorId,
      action: 'REQUIREMENT_CREATED',
      metadata: { title: requirement.title },
    });
    return requirement;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateRequirementDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    const requirement = await this.prisma.requirement.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.auditLog.record({
        organizationId,
        projectId: requirement.projectId,
        actorId,
        action: 'REQUIREMENT_STATUS_CHANGED',
        metadata: { from: existing.status, to: dto.status },
      });
    }

    return requirement;
  }

  // Requirement Analyzer (Phase 7 Module 2), simplified: rule-based
  // gap/ambiguity detection rather than an LLM-backed analysis — flags
  // requirements missing a description, with a too-short title, sharing a
  // title with another requirement in the project, or sitting in DRAFT
  // past a staleness threshold. A real AI-assisted analyzer is a separate
  // decision, deliberately not made here.
  async analyze(
    organizationId: string,
    projectId: string,
  ): Promise<RequirementAnalysis[]> {
    const requirements = await this.prisma.requirement.findMany({
      where: { organizationId, projectId },
    });

    const titleCounts = new Map<string, number>();
    for (const requirement of requirements) {
      const key = requirement.title.trim().toLowerCase();
      titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
    }

    const staleThreshold = Date.now() - STALE_DRAFT_DAYS * 24 * 60 * 60 * 1000;

    return requirements.map((requirement) => {
      const flags: string[] = [];
      if (!requirement.description || requirement.description.trim() === '') {
        flags.push('MISSING_DESCRIPTION');
      }
      if (requirement.title.trim().length < MIN_TITLE_LENGTH) {
        flags.push('TITLE_TOO_SHORT');
      }
      const titleKey = requirement.title.trim().toLowerCase();
      if ((titleCounts.get(titleKey) ?? 0) > 1) {
        flags.push('DUPLICATE_TITLE');
      }
      if (
        requirement.status === RequirementStatus.DRAFT &&
        requirement.createdAt.getTime() < staleThreshold
      ) {
        flags.push('STALE_DRAFT');
      }
      return { requirementId: requirement.id, title: requirement.title, flags };
    });
  }
}
