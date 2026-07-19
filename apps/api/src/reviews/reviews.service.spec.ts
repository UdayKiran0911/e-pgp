import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { ReviewStatus, ReviewType } from '../../generated/prisma/client';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: {
    project: { findFirst: jest.Mock };
    review: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditLog: { record: jest.Mock };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const project = { id: 'project-1', organizationId: orgId };
  const review = {
    id: 'review-1',
    organizationId: orgId,
    projectId: project.id,
    type: ReviewType.ARCHITECTURE,
    title: 'Service mesh adoption',
    description: null,
    status: ReviewStatus.SUBMITTED,
    requestedById: actorId,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      review: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new ReviewsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists reviews scoped to an organization, optionally filtered by project', async () => {
    prisma.review.findMany.mockResolvedValue([review]);

    const result = await service.findAllInOrganization(orgId, project.id);

    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: project.id },
      }),
    );
    expect(result).toEqual([review]);
  });

  it('rejects submitting a review against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        type: ReviewType.ARCHITECTURE,
        title: review.title,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.review.create).not.toHaveBeenCalled();
  });

  it('submits a review and writes a REVIEW_SUBMITTED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.review.create.mockResolvedValue(review);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      type: ReviewType.ARCHITECTURE,
      title: review.title,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: project.id,
        actorId,
        action: 'REVIEW_SUBMITTED',
      }),
    );
    expect(result).toEqual(review);
  });

  it('rejects resubmitting straight past a decision (APPROVED -> SUBMITTED)', async () => {
    prisma.review.findFirst.mockResolvedValue({
      ...review,
      status: ReviewStatus.APPROVED,
    });

    await expect(
      service.update(review.id, orgId, actorId, {
        status: ReviewStatus.SUBMITTED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.review.update).not.toHaveBeenCalled();
  });

  it('approves a submitted review and writes a REVIEW_STATUS_CHANGED audit log entry', async () => {
    prisma.review.findFirst.mockResolvedValue(review); // SUBMITTED
    prisma.review.update.mockResolvedValue({
      ...review,
      status: ReviewStatus.APPROVED,
    });

    const result = await service.update(review.id, orgId, actorId, {
      status: ReviewStatus.APPROVED,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: review.projectId,
        actorId,
        action: 'REVIEW_STATUS_CHANGED',
        metadata: { from: ReviewStatus.SUBMITTED, to: ReviewStatus.APPROVED },
      }),
    );
    expect(result.status).toBe(ReviewStatus.APPROVED);
  });

  it('rejects updating a review that is not in the caller organization', async () => {
    prisma.review.findFirst.mockResolvedValue(null);

    await expect(
      service.update(review.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.review.update).not.toHaveBeenCalled();
  });
});
