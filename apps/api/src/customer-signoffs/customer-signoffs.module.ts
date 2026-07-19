import { Module } from '@nestjs/common';
import { CustomerSignoffsController } from './customer-signoffs.controller';
import { CustomerSignoffsService } from './customer-signoffs.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [CustomerSignoffsController],
  providers: [CustomerSignoffsService],
  exports: [CustomerSignoffsService],
})
export class CustomerSignoffsModule {}
