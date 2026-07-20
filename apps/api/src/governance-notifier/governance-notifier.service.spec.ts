import { GovernanceNotifierService } from './governance-notifier.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhookConnectorsService } from '../webhook-connectors/webhook-connectors.service';
import { EmailService } from '../email/email.service';

describe('GovernanceNotifierService', () => {
  let service: GovernanceNotifierService;
  let prisma: { user: { findUnique: jest.Mock } };
  let notifications: { notify: jest.Mock };
  let webhooks: { notify: jest.Mock };
  let email: { send: jest.Mock };

  const orgId = 'org-1';
  const projectId = 'project-1';
  const recipientUserId = 'user-1';

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    notifications = { notify: jest.fn() };
    webhooks = { notify: jest.fn() };
    email = { send: jest.fn() };
    service = new GovernanceNotifierService(
      prisma as unknown as PrismaService,
      notifications as unknown as NotificationsService,
      webhooks as unknown as WebhookConnectorsService,
      email as unknown as EmailService,
    );
  });

  it('fans a decision out to in-app notification, webhook, and email', async () => {
    prisma.user.findUnique.mockResolvedValue({ email: 'requester@acme.test' });

    await service.notifyDecision({
      organizationId: orgId,
      projectId,
      recipientUserId,
      title: 'Change request "X" approved',
      emailSubject: 'Change request "X" approved',
      emailBody: 'Change request "X" is now APPROVED.',
    });

    expect(notifications.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        recipientId: recipientUserId,
        projectId,
        title: 'Change request "X" approved',
      }),
    );
    expect(webhooks.notify).toHaveBeenCalledWith(
      orgId,
      'Change request "X" approved',
    );
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: orgId,
        projectId,
        recipientEmail: 'requester@acme.test',
        subject: 'Change request "X" approved',
      }),
    );
  });

  it('skips the email entirely if the recipient user no longer exists', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await service.notifyDecision({
      organizationId: orgId,
      projectId,
      recipientUserId,
      title: 'Change request "X" rejected',
      emailSubject: 'Change request "X" rejected',
      emailBody: 'Change request "X" is now REJECTED.',
    });

    expect(notifications.notify).toHaveBeenCalled();
    expect(webhooks.notify).toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
  });
});
