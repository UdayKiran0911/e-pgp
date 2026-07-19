import { NotFoundException } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

describe('ChecklistService', () => {
  let service: ChecklistService;
  let prisma: {
    project: { findFirst: jest.Mock };
    checklistItem: {
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
  const item = {
    id: 'item-1',
    organizationId: orgId,
    projectId: project.id,
    title: 'Confirm rollback plan',
    isDone: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      project: { findFirst: jest.fn() },
      checklistItem: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new ChecklistService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists checklist items scoped to an organization, optionally filtered by project', async () => {
    prisma.checklistItem.findMany.mockResolvedValue([item]);

    const result = await service.findAllInOrganization(orgId, project.id);

    expect(prisma.checklistItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, projectId: project.id },
      }),
    );
    expect(result).toEqual([item]);
  });

  it('rejects adding an item against a project outside the caller organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, {
        projectId: project.id,
        title: item.title,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.checklistItem.create).not.toHaveBeenCalled();
  });

  it('adds an item and writes a CHECKLIST_ITEM_ADDED audit log entry', async () => {
    prisma.project.findFirst.mockResolvedValue(project);
    prisma.checklistItem.create.mockResolvedValue(item);

    const result = await service.create(orgId, actorId, {
      projectId: project.id,
      title: item.title,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: project.id,
        actorId,
        action: 'CHECKLIST_ITEM_ADDED',
      }),
    );
    expect(result).toEqual(item);
  });

  it('toggles isDone and writes a CHECKLIST_ITEM_TOGGLED audit log entry', async () => {
    prisma.checklistItem.findFirst.mockResolvedValue(item); // isDone: false
    prisma.checklistItem.update.mockResolvedValue({ ...item, isDone: true });

    const result = await service.update(item.id, orgId, actorId, {
      isDone: true,
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId: item.projectId,
        actorId,
        action: 'CHECKLIST_ITEM_TOGGLED',
        metadata: { title: item.title, isDone: true },
      }),
    );
    expect(result.isDone).toBe(true);
  });

  it('does not write an audit log entry when isDone is unchanged', async () => {
    prisma.checklistItem.findFirst.mockResolvedValue(item);
    prisma.checklistItem.update.mockResolvedValue({
      ...item,
      title: 'Renamed',
    });

    await service.update(item.id, orgId, actorId, { title: 'Renamed' });

    expect(auditLog.record).not.toHaveBeenCalled();
  });

  it('rejects updating an item that is not in the caller organization', async () => {
    prisma.checklistItem.findFirst.mockResolvedValue(null);

    await expect(
      service.update(item.id, 'org-2', actorId, { title: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.checklistItem.update).not.toHaveBeenCalled();
  });
});
