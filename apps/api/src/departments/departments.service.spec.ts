import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let prisma: {
    department: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditLog: { record: jest.Mock };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const engineering = {
    id: 'dept-1',
    organizationId: orgId,
    name: 'Engineering',
    parentId: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };
  const backend = {
    id: 'dept-2',
    organizationId: orgId,
    name: 'Backend',
    parentId: engineering.id,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      department: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new DepartmentsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists departments scoped to an organization', async () => {
    prisma.department.findMany.mockResolvedValue([engineering, backend]);

    const result = await service.findAllInOrganization(orgId);

    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: orgId } }),
    );
    expect(result).toEqual([engineering, backend]);
  });

  it('creates a top-level department and writes a DEPARTMENT_CREATED audit log entry', async () => {
    prisma.department.create.mockResolvedValue(engineering);

    const result = await service.create(orgId, actorId, {
      name: 'Engineering',
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        actorId,
        action: 'DEPARTMENT_CREATED',
      }),
    );
    expect(result).toEqual(engineering);
  });

  it('rejects creating a department under a parent outside the caller organization', async () => {
    prisma.department.findFirst.mockResolvedValue(null);

    await expect(
      service.create(orgId, actorId, { name: 'Backend', parentId: 'dept-x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.department.create).not.toHaveBeenCalled();
  });

  it('rejects reparenting a department under its own descendant', async () => {
    // existing lookup for the department being updated
    prisma.department.findFirst
      .mockResolvedValueOnce(engineering) // findOneInOrganization(engineering.id, ...)
      .mockResolvedValueOnce(backend); // assertParentInOrganization(backend.id, ...)
    // walking up from `backend` (the proposed new parent) reaches `engineering` itself
    prisma.department.findUnique.mockResolvedValueOnce({
      parentId: engineering.id,
    });

    await expect(
      service.update(engineering.id, orgId, actorId, { parentId: backend.id }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.department.update).not.toHaveBeenCalled();
  });

  it('renames a department and writes a DEPARTMENT_UPDATED audit log entry', async () => {
    prisma.department.findFirst.mockResolvedValue(engineering);
    prisma.department.update.mockResolvedValue({
      ...engineering,
      name: 'Product Engineering',
    });

    const result = await service.update(engineering.id, orgId, actorId, {
      name: 'Product Engineering',
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        actorId,
        action: 'DEPARTMENT_UPDATED',
        metadata: { from: 'Engineering', to: 'Product Engineering' },
      }),
    );
    expect(result.name).toBe('Product Engineering');
  });

  it('rejects updating a department that is not in the caller organization', async () => {
    prisma.department.findFirst.mockResolvedValue(null);

    await expect(
      service.update(engineering.id, 'org-2', actorId, { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.department.update).not.toHaveBeenCalled();
  });
});
