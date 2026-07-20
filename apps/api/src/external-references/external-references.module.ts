import { Module } from '@nestjs/common';
import { ExternalReferencesController } from './external-references.controller';
import { ExternalReferencesService } from './external-references.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ExternalReferencesController],
  providers: [ExternalReferencesService],
  exports: [ExternalReferencesService],
})
export class ExternalReferencesModule {}
