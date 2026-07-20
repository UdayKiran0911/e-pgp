import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  AuthResponseBody,
  ExternalReferenceBody,
  IssueBody,
  ProjectBody,
} from './test-types';

/**
 * Integration test: exercises linking/unlinking external references
 * (Jira/Azure DevOps/SharePoint/ServiceNow) to an Issue Register entry —
 * RBAC and org isolation — against a real Postgres instance (see
 * docker-compose.yml -> `postgres`). Run `docker compose up -d postgres`
 * before `pnpm test:integration`.
 */
describe('External References (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `External Ref Integration Org A ${suffix}`;
  const orgBName = `External Ref Integration Org B ${suffix}`;
  const orgAAdminEmail = `extref-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `extref-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `extref-org-a-member-${suffix}@acme.test`;
  const password = 'super-secret-1';

  let orgAAdminToken: string;
  let orgBAdminToken: string;
  let memberToken: string;
  let orgAIssueId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    prisma = moduleFixture.get(PrismaService);

    const orgA = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: orgAName,
        name: 'Org A Admin',
        email: orgAAdminEmail,
        password,
      });
    orgAAdminToken = (orgA.body as AuthResponseBody).accessToken;

    const orgB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: orgBName,
        name: 'Org B Admin',
        email: orgBAdminEmail,
        password,
      });
    orgBAdminToken = (orgB.body as AuthResponseBody).accessToken;

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ email: memberEmail, name: 'Org A Member', password });
    const memberLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: memberEmail, password });
    memberToken = (memberLogin.body as AuthResponseBody).accessToken;

    const project = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: 'External Reference Test Project' });
    const projectId = (project.body as ProjectBody).id;

    const issue = await request(app.getHttpServer())
      .post('/issues')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ projectId, title: 'Broken login flow', priority: 'HIGH' });
    orgAIssueId = (issue.body as IssueBody).id;
  });

  afterAll(async () => {
    const orgs = await prisma.organization.findMany({
      where: { name: { in: [orgAName, orgBName] } },
    });
    const orgIds = orgs.map((o) => o.id);
    await prisma.auditLog.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.externalReference.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.issue.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.project.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [orgAAdminEmail, orgBAdminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await app.close();
  });

  it('lets an ADMIN link a Jira reference to an issue and writes an EXTERNAL_REFERENCE_LINKED audit log entry', async () => {
    const response = await request(app.getHttpServer())
      .post('/external-references')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        issueId: orgAIssueId,
        provider: 'JIRA',
        externalId: 'EPG-101',
        url: 'https://acme.atlassian.net/browse/EPG-101',
      });

    expect(response.status).toBe(201);
    const body = response.body as ExternalReferenceBody;
    expect(body.provider).toBe('JIRA');
    expect(body.issueId).toBe(orgAIssueId);

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'EXTERNAL_REFERENCE_LINKED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects a MEMBER linking a reference but allows them to list references', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/external-references')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        issueId: orgAIssueId,
        provider: 'AZURE_DEVOPS',
        externalId: '1234',
        url: 'https://dev.azure.com/acme/_workitems/edit/1234',
      });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get(`/external-references?issueId=${orgAIssueId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
    expect((list.body as ExternalReferenceBody[]).length).toBeGreaterThan(0);
  });

  it('rejects linking a reference to an issue from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/external-references')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({
        issueId: orgAIssueId,
        provider: 'SERVICENOW',
        externalId: 'INC001',
        url: 'https://acme.service-now.com/incident.do?sys_id=1',
      });
    expect(response.status).toBe(404);
  });

  it('unlinks a reference and writes an EXTERNAL_REFERENCE_UNLINKED audit log entry', async () => {
    const created = await request(app.getHttpServer())
      .post('/external-references')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        issueId: orgAIssueId,
        provider: 'SHAREPOINT',
        externalId: 'doc-42',
        url: 'https://acme.sharepoint.com/sites/eng/doc-42',
      });
    const referenceId = (created.body as ExternalReferenceBody).id;

    const removed = await request(app.getHttpServer())
      .delete(`/external-references/${referenceId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`);
    expect(removed.status).toBe(200);

    const list = await request(app.getHttpServer())
      .get(`/external-references?issueId=${orgAIssueId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`);
    expect(
      (list.body as ExternalReferenceBody[]).some((r) => r.id === referenceId),
    ).toBe(false);

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'EXTERNAL_REFERENCE_UNLINKED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });
});
