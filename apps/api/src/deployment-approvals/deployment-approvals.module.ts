import { Module } from '@nestjs/common';
import { DeploymentApprovalsController } from './deployment-approvals.controller';
import { DeploymentApprovalsService } from './deployment-approvals.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [DeploymentApprovalsController],
  providers: [DeploymentApprovalsService],
  exports: [DeploymentApprovalsService],
})
export class DeploymentApprovalsModule {}
