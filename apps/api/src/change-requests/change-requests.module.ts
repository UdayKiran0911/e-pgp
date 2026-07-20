import { Module } from '@nestjs/common';
import { ChangeRequestsController } from './change-requests.controller';
import { ChangeRequestsService } from './change-requests.service';
import { AuthModule } from '../auth/auth.module';
import { GovernanceNotifierModule } from '../governance-notifier/governance-notifier.module';

@Module({
  imports: [AuthModule, GovernanceNotifierModule],
  controllers: [ChangeRequestsController],
  providers: [ChangeRequestsService],
  exports: [ChangeRequestsService],
})
export class ChangeRequestsModule {}
