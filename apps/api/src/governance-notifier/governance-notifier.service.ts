import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhookConnectorsService } from '../webhook-connectors/webhook-connectors.service';
import { EmailService } from '../email/email.service';

export interface NotifyDecisionParams {
  organizationId: string;
  projectId: string;
  recipientUserId: string;
  title: string;
  body?: string;
  emailSubject: string;
  emailBody: string;
}

// Extracted (Phase 8 Module 2) from Deployment Approvals, where this
// 4-channel fan-out (audit log stays at the call site — this only covers
// the 3 notification channels: in-app, webhook, email) was first built —
// see Phase 6 Module 12. Wiring a governed decision into every channel
// used to mean copy-pasting this block per module; now it's one call.
// Change Requests is the second consumer (see change-requests.service.ts);
// every other decision workflow (Reviews, Governance Gates, Customer
// Sign-off) still only writes an audit log — wiring those in too is a
// separate follow-up, not done in this batch.
@Injectable()
export class GovernanceNotifierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly webhooks: WebhookConnectorsService,
    private readonly email: EmailService,
  ) {}

  async notifyDecision(params: NotifyDecisionParams) {
    await this.notifications.notify({
      organizationId: params.organizationId,
      recipientId: params.recipientUserId,
      projectId: params.projectId,
      title: params.title,
      body: params.body,
    });

    await this.webhooks.notify(params.organizationId, params.title);

    const recipient = await this.prisma.user.findUnique({
      where: { id: params.recipientUserId },
      select: { email: true },
    });
    if (recipient) {
      await this.email.send({
        organizationId: params.organizationId,
        projectId: params.projectId,
        recipientEmail: recipient.email,
        subject: params.emailSubject,
        body: params.emailBody,
      });
    }
  }
}
