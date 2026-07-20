import { Module } from '@nestjs/common';
import { GovernanceNotifierService } from './governance-notifier.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebhookConnectorsModule } from '../webhook-connectors/webhook-connectors.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [NotificationsModule, WebhookConnectorsModule, EmailModule],
  providers: [GovernanceNotifierService],
  exports: [GovernanceNotifierService],
})
export class GovernanceNotifierModule {}
