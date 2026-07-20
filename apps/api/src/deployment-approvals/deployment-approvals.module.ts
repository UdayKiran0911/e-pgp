import { Module } from '@nestjs/common';
import { DeploymentApprovalsController } from './deployment-approvals.controller';
import { DeploymentApprovalsService } from './deployment-approvals.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceNotifierModule } from '../governance-notifier/governance-notifier.module';

@Module({
  imports: [AuthModule, GovernanceNotifierModule],
  controllers: [DeploymentApprovalsController],
  providers: [DeploymentApprovalsService],
  exports: [DeploymentApprovalsService],
})
export class DeploymentApprovalsModule {}
