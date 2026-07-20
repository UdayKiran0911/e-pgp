import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
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
import { EncryptionModule } from './encryption/encryption.module';
import { WebhookConnectorsModule } from './webhook-connectors/webhook-connectors.module';
import { PluginsModule } from './plugins/plugins.module';
import { SecurityFindingsModule } from './security-findings/security-findings.module';
import { ProjectHealthModule } from './project-health/project-health.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ChecklistTemplatesModule } from './checklist-templates/checklist-templates.module';
import { EmailModule } from './email/email.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsMiddleware } from './metrics/metrics.middleware';
import { ExternalReferencesModule } from './external-references/external-references.module';

// Structured Logging (Phase 10 Module 7): pino via nestjs-pino, replacing
// Nest's default console logger everywhere (main.ts wires
// `app.useLogger(app.get(Logger))`). JSON lines in production, pretty-
// printed in development; every request gets a stable `req.id` (reused
// from an incoming X-Request-Id header when present) so a request can be
// traced across every log line it produces. Centralized log aggregation
// (shipping these lines to a log store) is a separate infra decision,
// deliberately not made here — this establishes the format, so wiring
// one in later is a transport-config change, not a rewrite.
const loggerModule = LoggerModule.forRoot({
  pinoHttp: {
    genReqId: (req: {
      headers: Record<string, string | string[] | undefined>;
    }) => (req.headers['x-request-id'] as string | undefined) ?? randomUUID(),
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { singleLine: true } }
        : undefined,
    redact: ['req.headers.authorization'],
  },
});

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    loggerModule,
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
    EncryptionModule,
    WebhookConnectorsModule,
    PluginsModule,
    SecurityFindingsModule,
    ProjectHealthModule,
    AnalyticsModule,
    ChecklistTemplatesModule,
    EmailModule,
    MetricsModule,
    ExternalReferencesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
