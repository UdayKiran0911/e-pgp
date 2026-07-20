import { NotFoundException } from '@nestjs/common';
import { WebhookConnectorsService } from './webhook-connectors.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { EncryptionService } from '../encryption/encryption.service';
import { WebhookProvider } from '../../generated/prisma/client';

interface CreateCallArgs {
  data: {
    organizationId: string;
    name: string;
    provider: WebhookProvider;
    encryptedUrl: string;
  };
}

interface UpdateCallArgs {
  where: { id: string };
  data: { name?: string; isActive?: boolean; encryptedUrl?: string };
}

describe('WebhookConnectorsService', () => {
  let service: WebhookConnectorsService;
  let prisma: {
    webhookConnector: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock<Promise<unknown>, [CreateCallArgs]>;
      update: jest.Mock<Promise<unknown>, [UpdateCallArgs]>;
    };
  };
  let auditLog: { record: jest.Mock };
  let encryption: { encrypt: jest.Mock; decrypt: jest.Mock };

  const orgId = 'org-1';
  const actorId = 'user-1';
  const connector = {
    id: 'conn-1',
    organizationId: orgId,
    name: 'Ops Slack',
    provider: WebhookProvider.SLACK,
    encryptedUrl: 'iv:tag:cipher',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      webhookConnector: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn<Promise<unknown>, [CreateCallArgs]>(),
        update: jest.fn<Promise<unknown>, [UpdateCallArgs]>(),
      },
    };
    auditLog = { record: jest.fn() };
    encryption = {
      encrypt: jest.fn().mockReturnValue('iv:tag:cipher'),
      decrypt: jest.fn().mockReturnValue('https://hooks.slack.com/services/x'),
    };
    service = new WebhookConnectorsService(
      prisma as unknown as PrismaService,
      auditLog as unknown as AuditLogService,
      encryption as unknown as EncryptionService,
    );
  });

  it('never returns encryptedUrl from findAll', async () => {
    prisma.webhookConnector.findMany.mockResolvedValue([connector]);

    const result = await service.findAllInOrganization(orgId);

    expect(result).toEqual([
      {
        id: connector.id,
        organizationId: orgId,
        name: connector.name,
        provider: connector.provider,
        isActive: true,
        createdAt: connector.createdAt,
        updatedAt: connector.updatedAt,
      },
    ]);
  });

  it('encrypts the URL on create and writes a WEBHOOK_CONNECTOR_CREATED audit log entry', async () => {
    prisma.webhookConnector.create.mockResolvedValue(connector);

    const result = await service.create(orgId, actorId, {
      name: 'Ops Slack',
      provider: WebhookProvider.SLACK,
      url: 'https://hooks.slack.com/services/x',
    });

    expect(encryption.encrypt).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/x',
    );
    expect(
      prisma.webhookConnector.create.mock.calls[0][0].data.encryptedUrl,
    ).toBe('iv:tag:cipher');
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'WEBHOOK_CONNECTOR_CREATED' }),
    );
    expect(result).not.toHaveProperty('encryptedUrl');
  });

  it('rejects updating a connector that is not in the caller organization', async () => {
    prisma.webhookConnector.findFirst.mockResolvedValue(null);

    await expect(
      service.update(connector.id, orgId, actorId, { name: 'X' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.webhookConnector.update).not.toHaveBeenCalled();
  });

  it('re-encrypts the URL only when a new one is provided on update', async () => {
    prisma.webhookConnector.findFirst.mockResolvedValue(connector);
    prisma.webhookConnector.update.mockResolvedValue(connector);

    await service.update(connector.id, orgId, actorId, { isActive: false });

    expect(encryption.encrypt).not.toHaveBeenCalled();
    expect(prisma.webhookConnector.update.mock.calls[0][0].data.isActive).toBe(
      false,
    );
  });

  it('notifies every active connector by decrypting its URL and posting a message', async () => {
    prisma.webhookConnector.findMany.mockResolvedValue([connector]);
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    await service.notify(orgId, 'Deployment approved');

    expect(prisma.webhookConnector.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: orgId, isActive: true },
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/x',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('does not throw when a webhook delivery fails', async () => {
    prisma.webhookConnector.findMany.mockResolvedValue([connector]);
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    await expect(service.notify(orgId, 'hi')).resolves.toBeUndefined();
  });
});
