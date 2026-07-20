import { Module } from '@nestjs/common';
import { SecurityFindingsController } from './security-findings.controller';
import { SecurityFindingsService } from './security-findings.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SecurityFindingsController],
  providers: [SecurityFindingsService],
  exports: [SecurityFindingsService],
})
export class SecurityFindingsModule {}
