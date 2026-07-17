import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectStatus } from '../../generated/prisma/client';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: {
    project: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    auditLog: { create: jest.Mock };
  };

  const orgId = 'org-1';
  const otherOrgId = 'org-2';
  const actorId = 'user-1';
  const project = {
    id: 'project-1',
    name: 'Website Revamp',
    status: ProjectStatus.DRAFT,
    organizationId: orgId,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: { create: jest.fn() },
    };
    service = new ProjectsService(prisma as unknown as PrismaService);
  });

  it('lists projects scoped to an organization', async () => {
    prisma.project.findMany.mockResolvedValue([project]);

    const result = await service.findAllInOrganization(orgId);

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: orgId } }),
    );
    expect(result).toEqual([project]);
  });

  it('does not find a project belonging to a different organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.findOneInOrganization(project.id, otherOrgId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a project and writes a PROJECT_CREATED audit log entry', async () => {
    prisma.project.create.mockResolvedValue(project);

    const result = await service.create(orgId, actorId, { name: project.name });

    expect(prisma.project.create).toHaveBeenCalledWith({
      data: { name: project.name, organizationId: orgId },
    });
    const [[auditArgs]] = prisma.auditLog.create.mock.calls as [
      [{ data: { projectId: string; actorId: string; action: string } }],
    ];
    expect(auditArgs.data.projectId).toBe(project.id);
    expect(auditArgs.data.actorId).toBe(actorId);
    expect(auditArgs.data.action).toBe('PROJECT_CREATED');
    expect(result).toEqual(project);
  });

  it('rejects an invalid status transition without writing or updating', async () => {
    prisma.project.findFirst.mockResolvedValue(project); // DRAFT

    await expect(
      service.update(project.id, orgId, actorId, {
        status: ProjectStatus.COMPLETED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.project.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('applies a valid status transition and writes a PROJECT_STATUS_CHANGED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project); // DRAFT
    prisma.project.update.mockResolvedValue({
      ...project,
      status: ProjectStatus.ACTIVE,
    });

    const result = await service.update(project.id, orgId, actorId, {
      status: ProjectStatus.ACTIVE,
    });

    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: project.id },
      data: { status: ProjectStatus.ACTIVE },
    });
    const [[auditArgs]] = prisma.auditLog.create.mock.calls as [
      [
        {
          data: {
            projectId: string;
            actorId: string;
            action: string;
            metadata: { from: ProjectStatus; to: ProjectStatus };
          };
        },
      ],
    ];
    expect(auditArgs.data.projectId).toBe(project.id);
    expect(auditArgs.data.actorId).toBe(actorId);
    expect(auditArgs.data.action).toBe('PROJECT_STATUS_CHANGED');
    expect(auditArgs.data.metadata).toEqual({
      from: ProjectStatus.DRAFT,
      to: ProjectStatus.ACTIVE,
    });
    expect(result.status).toBe(ProjectStatus.ACTIVE);
  });

  it('updates the name without writing an audit log entry when status is unchanged', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.project.update.mockResolvedValue({ ...project, name: 'Renamed' });

    await service.update(project.id, orgId, actorId, { name: 'Renamed' });

    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('rejects updating a project that is not in the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.update(project.id, otherOrgId, actorId, { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.project.update).not.toHaveBeenCalled();
  });
});
