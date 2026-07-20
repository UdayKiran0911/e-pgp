import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { EncryptionService } from '../encryption/encryption.service';
import { CreateWebhookConnectorDto } from './dto/create-webhook-connector.dto';
import { UpdateWebhookConnectorDto } from './dto/update-webhook-connector.dto';
import { WebhookConnector } from '../../generated/prisma/client';

// The stored connector minus `encryptedUrl` — the secret is write-only,
// never returned by list/get once set.
type PublicWebhookConnector = Omit<WebhookConnector, 'encryptedUrl'>;

@Injectable()
export class WebhookConnectorsService {
  private readonly logger = new Logger(WebhookConnectorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly encryption: EncryptionService,
  ) {}

  async findAllInOrganization(
    organizationId: string,
  ): Promise<PublicWebhookConnector[]> {
    const connectors = await this.prisma.webhookConnector.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return connectors.map((c) => this.toPublic(c));
  }

  async create(
    organizationId: string,
    actorId: string,
    dto: CreateWebhookConnectorDto,
  ): Promise<PublicWebhookConnector> {
    const connector = await this.prisma.webhookConnector.create({
      data: {
        organizationId,
        name: dto.name,
        provider: dto.provider,
        encryptedUrl: this.encryption.encrypt(dto.url),
      },
    });
    await this.auditLog.record({
      organizationId,
      actorId,
      action: 'WEBHOOK_CONNECTOR_CREATED',
      metadata: { name: connector.name, provider: connector.provider },
    });
    return this.toPublic(connector);
  }

  async update(
    id: string,
    organizationId: string,
    actorId: string,
    dto: UpdateWebhookConnectorDto,
  ): Promise<PublicWebhookConnector> {
    const existing = await this.prisma.webhookConnector.findFirst({
      where: { id, organizationId },
    });
    if (!existing) {
      throw new NotFoundException('Webhook connector not found.');
    }

    const connector = await this.prisma.webhookConnector.update({
      where: { id },
      data: {
        name: dto.name,
        isActive: dto.isActive,
        ...(dto.url ? { encryptedUrl: this.encryption.encrypt(dto.url) } : {}),
      },
    });
    await this.auditLog.record({
      organizationId,
      actorId,
      action: 'WEBHOOK_CONNECTOR_UPDATED',
      metadata: { name: connector.name },
    });
    return this.toPublic(connector);
  }

  // Best-effort fan-out to every active connector in the organization —
  // used internally by other services (e.g. Deployment Governance
  // decisions) the same way NotificationsService is. A failing webhook
  // never throws back to the caller; it's logged and skipped.
  async notify(organizationId: string, message: string): Promise<void> {
    const connectors = await this.prisma.webhookConnector.findMany({
      where: { organizationId, isActive: true },
    });
    await Promise.all(
      connectors.map(async (connector) => {
        try {
          const url = this.encryption.decrypt(connector.encryptedUrl);
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message }),
          });
        } catch (err) {
          this.logger.warn(
            `Webhook delivery failed for connector ${connector.id}: ${String(err)}`,
          );
        }
      }),
    );
  }

  private toPublic(connector: WebhookConnector): PublicWebhookConnector {
    const {
      id,
      organizationId,
      name,
      provider,
      isActive,
      createdAt,
      updatedAt,
    } = connector;
    return {
      id,
      organizationId,
      name,
      provider,
      isActive,
      createdAt,
      updatedAt,
    };
  }
}
