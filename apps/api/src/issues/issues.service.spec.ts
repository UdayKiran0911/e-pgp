import { NotFoundException } from '@nestjs/common';
import { IssuesService } from './issues.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { IssuePriority, IssueStatus } from '../../generated/prisma/client';

describe('IssuesService', () => {
  let service: IssuesService;
  let prisma: {
    project: { findFirst: jest.Mock };
    issue: {
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
  const issue = {
    id: 'issue-1',
    organizationId: orgId,
    projectId: project.id,
    title: 'Build failing on main',
    description: null,
    priority: IssuePriority.HIGH,
    status: IssueStatus.OPEN,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      issue: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new IssuesService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists issues scoped to an organization, optionally filtered by project', async () => {
    prisma.issue.findMany.mockResolvedValue([issue]);

    const result = await service.findAllInOrganization(orgId, project.id);

    expect(prisma.issue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: project.id },
      }),
    );
    expect(result).toEqual([issue]);
  });

  it('rejects creating an issue against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        title: issue.title,
        priority: IssuePriority.HIGH,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.issue.create).not.toHaveBeenCalled();
  });

  it('creates an issue and writes an ISSUE_CREATED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.issue.create.mockResolvedValue(issue);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      title: issue.title,
      priority: IssuePriority.HIGH,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: project.id,
        actorId,
        action: 'ISSUE_CREATED',
      }),
    );
    expect(result).toEqual(issue);
  });

  it('updates the status and writes an ISSUE_STATUS_CHANGED audit log entry', async () => {
    prisma.issue.findFirst.mockResolvedValue(issue);
    prisma.issue.update.mockResolvedValue({
      ...issue,
      status: IssueStatus.IN_PROGRESS,
    });

    const result = await service.update(issue.id, orgId, actorId, {
      status: IssueStatus.IN_PROGRESS,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: issue.projectId,
        actorId,
        action: 'ISSUE_STATUS_CHANGED',
        metadata: { from: IssueStatus.OPEN, to: IssueStatus.IN_PROGRESS },
      }),
    );
    expect(result.status).toBe(IssueStatus.IN_PROGRESS);
  });

  it('does not write an audit log entry when status is unchanged', async () => {
    prisma.issue.findFirst.mockResolvedValue(issue);
    prisma.issue.update.mockResolvedValue({ ...issue, description: 'Updated' });

    await service.update(issue.id, orgId, actorId, {
      description: 'Updated',
    });

    expect(auditLog.record).not.toHaveBeenCalled();
  });

  it('rejects updating an issue that is not in the caller organization', async () => {
    prisma.issue.findFirst.mockResolvedValue(null);

    await expect(
      service.update(issue.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.issue.update).not.toHaveBeenCalled();
  });
});
