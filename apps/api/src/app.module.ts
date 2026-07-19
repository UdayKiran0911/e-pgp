import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuditLogModule } from './audit/audit-log.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { RisksModule } from './risks/risks.module';
import { DecisionsModule } from './decisions/decisions.module';
import { IssuesModule } from './issues/issues.module';
import { ChangeRequestsModule } from './change-requests/change-requests.module';
import { RequirementsModule } from './requirements/requirements.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ChecklistModule } from './checklist/checklist.module';
import { DepartmentsModule } from './departments/departments.module';
import { SopsModule } from './sops/sops.module';
import { DocumentsModule } from './documents/documents.module';
import { GovernanceGatesModule } from './governance-gates/governance-gates.module';
import { CustomerSignoffsModule } from './customer-signoffs/customer-signoffs.module';
import { DeploymentApprovalsModule } from './deployment-approvals/deployment-approvals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { KnowledgeArticlesModule } from './knowledge-articles/knowledge-articles.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditLogModule,
    HealthModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    ProjectsModule,
    RisksModule,
    DecisionsModule,
    IssuesModule,
    ChangeRequestsModule,
    RequirementsModule,
    ReviewsModule,
    ChecklistModule,
    DepartmentsModule,
    SopsModule,
    DocumentsModule,
    GovernanceGatesModule,
    CustomerSignoffsModule,
    DeploymentApprovalsModule,
    NotificationsModule,
    KnowledgeArticlesModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
