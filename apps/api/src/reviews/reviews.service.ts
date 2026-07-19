import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { isValidReviewTransition } from './review-status';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  findAllInOrganization(organizationId: string, projectId?: string) {
    return this.prisma.review.findMany({
      where: { organizationId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const review = await this.prisma.review.findFirst({
      where: { id, organizationId },
    });
    if (!review) {
      throw new NotFoundException('Review not found.');
    }
    return review;
  }

  async create(organizationId: string, actorId: string, dto: CreateReviewDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const review = await this.prisma.review.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        requestedById: actorId,
      },
    });
    await this.auditLog.record({
      organizationId,
      projectId: review.projectId,
      actorId,
      action: 'REVIEW_SUBMITTED',
      metadata: { type: review.type, title: review.title },
    });
    return review;
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateReviewDto,
  ) {
    const existing = await this.findOneInOrganization(id, organizationId);

    if (dto.status && !isValidReviewTransition(existing.status, dto.status)) {
      throw new BadRequestException(
        `Cannot move a review from ${existing.status} to ${dto.status}.`,
      );
    }

    const review = await this.prisma.review.update({
      where: { id },
      data: dto,
    });

    if (dto.status && dto.status !== existing.status) {
      await this.auditLog.record({
        organizationId,
        projectId: review.projectId,
        actorId,
        action: 'REVIEW_STATUS_CHANGED',
        metadata: { from: existing.status, to: dto.status },
      });
    }

    return review;
  }
}
