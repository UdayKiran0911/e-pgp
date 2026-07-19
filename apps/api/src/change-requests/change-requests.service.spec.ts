import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChangeRequestsService } from './change-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { ChangeRequestStatus } from '../../generated/prisma/client';

describe('ChangeRequestsService', () => {
  let service: ChangeRequestsService;
  let prisma: {
    project: { findFirst: jest.Mock };
    changeRequest: {
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
  const changeRequest = {
    id: 'cr-1',
    organizationId: orgId,
    projectId: project.id,
    title: 'Extend deployment window',
    description: null,
    status: ChangeRequestStatus.SUBMITTED,
    requestedById: actorId,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      changeRequest: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new ChangeRequestsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists change requests scoped to an organization, optionally filtered by project', async () => {
    prisma.changeRequest.findMany.mockResolvedValue([changeRequest]);

    const result = await service.findAllInOrganization(orgId, project.id);

    expect(prisma.changeRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: project.id },
      }),
    );
    expect(result).toEqual([changeRequest]);
  });

  it('rejects submitting a change request against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        title: changeRequest.title,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.changeRequest.create).not.toHaveBeenCalled();
  });

  it('submits a change request and writes a CHANGE_REQUEST_SUBMITTED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.changeRequest.create.mockResolvedValue(changeRequest);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      title: changeRequest.title,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: project.id,
        actorId,
        action: 'CHANGE_REQUEST_SUBMITTED',
      }),
    );
    expect(result).toEqual(changeRequest);
  });

  it('rejects an invalid status transition without writing or updating', async () => {
    prisma.changeRequest.findFirst.mockResolvedValue(changeRequest); // SUBMITTED

    await expect(
      service.update(changeRequest.id, orgId, actorId, {
        status: ChangeRequestStatus.IMPLEMENTED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.changeRequest.update).not.toHaveBeenCalled();
    expect(auditLog.record).not.toHaveBeenCalled();
  });

  it('approves a submitted request and writes a CHANGE_REQUEST_STATUS_CHANGED audit log entry', async () => {
    prisma.changeRequest.findFirst.mockResolvedValue(changeRequest); // SUBMITTED
    prisma.changeRequest.update.mockResolvedValue({
      ...changeRequest,
      status: ChangeRequestStatus.APPROVED,
    });

    const result = await service.update(changeRequest.id, orgId, actorId, {
      status: ChangeRequestStatus.APPROVED,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: changeRequest.projectId,
        actorId,
        action: 'CHANGE_REQUEST_STATUS_CHANGED',
        metadata: {
          from: ChangeRequestStatus.SUBMITTED,
          to: ChangeRequestStatus.APPROVED,
        },
      }),
    );
    expect(result.status).toBe(ChangeRequestStatus.APPROVED);
  });

  it('rejects updating a change request that is not in the caller organization', async () => {
    prisma.changeRequest.findFirst.mockResolvedValue(null);

    await expect(
      service.update(changeRequest.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.changeRequest.update).not.toHaveBeenCalled();
  });
});
