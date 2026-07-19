import { Module } from '@nestjs/common';
import { SopsController } from './sops.controller';
import { SopsService } from './sops.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SopsController],
  providers: [SopsService],
  exports: [SopsService],
})
export class SopsModule {}
