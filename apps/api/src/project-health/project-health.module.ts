import { Module } from '@nestjs/common';
import { ProjectHealthController } from './project-health.controller';
import { ProjectHealthService } from './project-health.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProjectHealthController],
  providers: [ProjectHealthService],
  exports: [ProjectHealthService],
})
export class ProjectHealthModule {}
