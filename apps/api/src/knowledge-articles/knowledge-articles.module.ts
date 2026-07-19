import { Module } from '@nestjs/common';
import { KnowledgeArticlesController } from './knowledge-articles.controller';
import { KnowledgeArticlesService } from './knowledge-articles.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [KnowledgeArticlesController],
  providers: [KnowledgeArticlesService],
  exports: [KnowledgeArticlesService],
})
export class KnowledgeArticlesModule {}
