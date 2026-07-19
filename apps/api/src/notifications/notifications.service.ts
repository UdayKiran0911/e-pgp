import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface NotifyParams {
  organizationId: string;
  recipientId: string;
  title: string;
  body?: string;
  projectId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  notify(params: NotifyParams) {
    return this.prisma.notification.create({ data: params });
  }

  findMineInOrganization(
    organizationId: string,
    recipientId: string,
    unreadOnly?: boolean,
  ) {
    return this.prisma.notification.findMany({
      where: {
        organizationId,
        recipientId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(id: string, organizationId: string, recipientId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id, organizationId, recipientId },
    });
    if (!existing) {
      throw new NotFoundException('Notification not found.');
    }
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead(organizationId: string, recipientId: string) {
    await this.prisma.notification.updateMany({
      where: { organizationId, recipientId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }
}
