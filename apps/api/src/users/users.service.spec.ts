import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { Role } from '../../generated/prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };
  let auditLog: { record: jest.Mock };

  const orgId = 'org-1';
  const otherOrgId = 'org-2';
  const actorId = 'admin-1';
  const user = {
    id: 'user-1',
    email: 'member@acme.test',
    name: 'Mem Ber',
    passwordHash: 'hashed',
    role: Role.MEMBER,
    organizationId: orgId,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    auditLog = { record: jest.fn() };
    service = new UsersService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
    );
  });

  it('lists users scoped to an organization, without password hashes', async () => {
    prisma.user.findMany.mockResolvedValue([user]);

    const result = await service.findAllInOrganization(orgId);

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: orgId } }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('passwordHash');
  });

  it('does not leak a user that belongs to a different organization', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.findOneInOrganization(user.id, otherOrgId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: user.id, organizationId: otherOrgId },
    });
  });

  it('rejects creating a user with an email already in use', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(
      service.create(orgId, {
        email: user.email,
        name: 'New Name',
        password: 'super-secret-1',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates a user scoped to the caller organization, defaulting role via Prisma', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(user);

    const result = await service.create(orgId, {
      email: user.email,
      name: user.name,
      password: 'super-secret-1',
    });

    const [[createArgs]] = prisma.user.create.mock.calls as [
      [{ data: { organizationId: string } }],
    ];
    expect(createArgs.data.organizationId).toBe(orgId);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects updating a user that is not in the caller organization', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      service.update(user.id, otherOrgId, actorId, { role: Role.ADMIN }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('writes a USER_ROLE_CHANGED audit log entry when the role changes', async () => {
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue({ ...user, role: Role.ADMIN });

    await service.update(user.id, orgId, actorId, { role: Role.ADMIN });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        actorId,
        action: 'USER_ROLE_CHANGED',
        metadata: { userId: user.id, from: Role.MEMBER, to: Role.ADMIN },
      }),
    );
  });

  it('writes a USER_DEACTIVATED audit log entry when isActive turns false', async () => {
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue({ ...user, isActive: false });

    await service.update(user.id, orgId, actorId, { isActive: false });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        actorId,
        action: 'USER_DEACTIVATED',
        metadata: { userId: user.id },
      }),
    );
  });

  it('writes a USER_REACTIVATED audit log entry when isActive turns true', async () => {
    const inactiveUser = { ...user, isActive: false };
    prisma.user.findFirst.mockResolvedValue(inactiveUser);
    prisma.user.update.mockResolvedValue({ ...user, isActive: true });

    await service.update(user.id, orgId, actorId, { isActive: true });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        actorId,
        action: 'USER_REACTIVATED',
        metadata: { userId: user.id },
      }),
    );
  });

  it('does not write an audit log entry when nothing meaningful changes', async () => {
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue(user);

    await service.update(user.id, orgId, actorId, { name: 'Mem Ber' });

    expect(auditLog.record).not.toHaveBeenCalled();
  });
});
