import { Module } from '@nestjs/common';
import { WebhookConnectorsController } from './webhook-connectors.controller';
import { WebhookConnectorsService } from './webhook-connectors.service';
import { AuthModule } from '../auth/auth.module';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [AuthModule, EncryptionModule],
  controllers: [WebhookConnectorsController],
  providers: [WebhookConnectorsService],
  exports: [WebhookConnectorsService],
})
export class WebhookConnectorsModule {}
