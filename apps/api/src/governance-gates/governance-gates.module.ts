import { Module } from '@nestjs/common';
import { GovernanceGatesController } from './governance-gates.controller';
import { GovernanceGatesService } from './governance-gates.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [GovernanceGatesController],
  providers: [GovernanceGatesService],
  exports: [GovernanceGatesService],
})
export class GovernanceGatesModule {}
