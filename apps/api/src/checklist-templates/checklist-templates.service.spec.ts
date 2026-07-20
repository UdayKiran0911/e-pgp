import { NotFoundException } from '@nestjs/common';
import { ChecklistTemplatesService } from './checklist-templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

describe('ChecklistTemplatesService', () => {
  let service: ChecklistTemplatesService;
  let tx: {
    checklistTemplateItem: { deleteMany: jest.Mock };
    checklistTemplate: { update: jest.Mock };
  };
  let prisma: {
    checklistTemplate: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    checklistItem: { createMany: jest.Mock; findMany: jest.Mock };
    project: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let auditLog: { record: jest.Mock };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const projectId = 'project-1';
  const template = {
    id: 'template-1',
    organizationId: orgId,
    name: 'Pre-launch checklist',
    description: null,
    items: [
      {
        id: 'item-1',
        templateId: 'template-1',
        title: 'Confirm rollback plan',
        order: 0,
      },
      {
        id: 'item-2',
        templateId: 'template-1',
        title: 'Notify stakeholders',
        order: 1,
      },
    ],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    tx = {
      checklistTemplateItem: { deleteMany: jest.fn() },
      checklistTemplate: { update: jest.fn() },
    };
    prisma = {
      checklistTemplate: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      checklistItem: { createMany: jest.fn(), findMany: jest.fn() },
      project: { findFirst: jest.fn() },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(tx)),
    };
    auditLog = { record: jest.fn() };
    service = new ChecklistTemplatesService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('creates a template with ordered items and writes a CHECKLIST_TEMPLATE_CREATED audit log entry', async () => {
    prisma.checklistTemplate.create.mockResolvedValue(template);

    const result = await service.create(orgId, actorId, {
      name: template.name,
      items: ['Confirm rollback plan', 'Notify stakeholders'],
    });

    const createCalls = prisma.checklistTemplate.create.mock
      .calls as unknown[][];
    const createArgs = createCalls[0][0] as {
      data: { items: { create: { title: string; order: number }[] } };
    };
    expect(createArgs.data.items).toEqual({
      create: [
        { title: 'Confirm rollback plan', order: 0 },
        { title: 'Notify stakeholders', order: 1 },
      ],
    });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CHECKLIST_TEMPLATE_CREATED' }),
    );
    expect(result).toEqual(template);
  });

  it('rejects updating a template that is not in the caller organization', async () => {
    prisma.checklistTemplate.findFirst.mockResolvedValue(null);

    await expect(
      service.update(template.id, orgId, actorId, { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.checklistTemplate.update).not.toHaveBeenCalled();
  });

  it('replaces items inside a transaction when items are provided on update', async () => {
    prisma.checklistTemplate.findFirst.mockResolvedValue(template);
    tx.checklistTemplate.update.mockResolvedValue(template);

    await service.update(template.id, orgId, actorId, {
      items: ['New step'],
    });

    expect(tx.checklistTemplateItem.deleteMany).toHaveBeenCalledWith({
      where: { templateId: template.id },
    });
    const updateCalls = tx.checklistTemplate.update.mock.calls as unknown[][];
    const updateArgs = updateCalls[0][0] as {
      data: { items: { create: { title: string; order: number }[] } };
    };
    expect(updateArgs.data.items).toEqual({
      create: [{ title: 'New step', order: 0 }],
    });
  });

  it('does not touch items when updating only the name', async () => {
    prisma.checklistTemplate.findFirst.mockResolvedValue(template);
    tx.checklistTemplate.update.mockResolvedValue(template);

    await service.update(template.id, orgId, actorId, { name: 'Renamed' });

    expect(tx.checklistTemplateItem.deleteMany).not.toHaveBeenCalled();
  });

  it('rejects applying a template to a project outside the caller organization', async () => {
    prisma.checklistTemplate.findFirst.mockResolvedValue(template);
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      service.apply(orgId, actorId, template.id, { projectId }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.checklistItem.createMany).not.toHaveBeenCalled();
  });

  it('bulk-creates checklist items from the template and writes a CHECKLIST_TEMPLATE_APPLIED audit log entry', async () => {
    prisma.checklistTemplate.findFirst.mockResolvedValue(template);
    prisma.project.findFirst.mockResolvedValue({
      id: projectId,
      organizationId: orgId,
    });
    prisma.checklistItem.findMany.mockResolvedValue([
      { id: 'ci-1', title: 'Confirm rollback plan' },
      { id: 'ci-2', title: 'Notify stakeholders' },
    ]);

    const result = await service.apply(orgId, actorId, template.id, {
      projectId,
    });

    expect(prisma.checklistItem.createMany).toHaveBeenCalledWith({
      data: [
        { organizationId: orgId, projectId, title: 'Confirm rollback plan' },
        { organizationId: orgId, projectId, title: 'Notify stakeholders' },
      ],
    });
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CHECKLIST_TEMPLATE_APPLIED' }),
    );
    expect(result).toHaveLength(2);
  });
});
