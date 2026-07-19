import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notification: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  const orgId = 'org-1';
  const recipientId = 'user-1';
  const notification = {
    id: 'notif-1',
    organizationId: orgId,
    projectId: null,
    recipientId,
    title: 'Deployment approved',
    body: null,
    isRead: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it('creates a notification for the given recipient', async () => {
    prisma.notification.create.mockResolvedValue(notification);

    const result = await service.notify({
      organizationId: orgId,
      recipientId,
      title: notification.title,
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { organizationId: orgId, recipientId, title: notification.title },
    });
    expect(result).toEqual(notification);
  });

  it('lists only the current recipient notifications, optionally unread-only', async () => {
    prisma.notification.findMany.mockResolvedValue([notification]);

    const result = await service.findMineInOrganization(
      orgId,
      recipientId,
      true,
    );

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, recipientId, isRead: false },
      }),
    );
    expect(result).toEqual([notification]);
  });

  it('rejects marking a notification read that does not belong to the caller', async () => {
    prisma.notification.findFirst.mockResolvedValue(null);

    await expect(
      service.markRead(notification.id, orgId, 'someone-else'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('marks a notification read', async () => {
    prisma.notification.findFirst.mockResolvedValue(notification);
    prisma.notification.update.mockResolvedValue({
      ...notification,
      isRead: true,
    });

    const result = await service.markRead(notification.id, orgId, recipientId);

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: notification.id },
      data: { isRead: true },
    });
    expect(result.isRead).toBe(true);
  });

  it('marks all of the caller unread notifications as read', async () => {
    prisma.notification.updateMany.mockResolvedValue({ count: 3 });

    const result = await service.markAllRead(orgId, recipientId);

    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { organizationId: orgId, recipientId, isRead: false },
      data: { isRead: true },
    });
    expect(result).toEqual({ success: true });
  });
});
