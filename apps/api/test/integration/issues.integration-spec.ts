import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, IssueBody, ProjectBody } from './test-types';

/**
 * Integration test: exercises Issue Register CRUD, RBAC, and org isolation
 * against a real Postgres instance (see docker-compose.yml -> `postgres`).
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Issues (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Issues Integration Org A ${suffix}`;
  const orgBName = `Issues Integration Org B ${suffix}`;
  const orgAAdminEmail = `issues-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `issues-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `issues-org-a-member-${suffix}@acme.test`;
  const password = 'super-secret-1';

  let orgAAdminToken: string;
  let orgBAdminToken: string;
  let memberToken: string;
  let orgAProjectId: string;

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
      .send({ name: 'Issue Register Test Project' });
    orgAProjectId = (project.body as ProjectBody).id;
  });

  afterAll(async () => {
    const orgs = await prisma.organization.findMany({
      where: { name: { in: [orgAName, orgBName] } },
    });
    const orgIds = orgs.map((o) => o.id);
    await prisma.auditLog.deleteMany({
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

  it('lets an ADMIN log an issue against a project, defaulting to OPEN', async () => {
    const response = await request(app.getHttpServer())
      .post('/issues')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Build failing on main',
        priority: 'HIGH',
      });

    expect(response.status).toBe(201);
    const body = response.body as IssueBody;
    expect(body.title).toBe('Build failing on main');
    expect(body.status).toBe('OPEN');
  });

  it('rejects a MEMBER logging an issue but allows them to list issues', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/issues')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Should fail',
        priority: 'LOW',
      });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get(`/issues?projectId=${orgAProjectId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
    expect((list.body as IssueBody[]).length).toBeGreaterThan(0);
  });

  it('updates an issue status and writes an ISSUE_STATUS_CHANGED audit log entry', async () => {
    const created = await request(app.getHttpServer())
      .post('/issues')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Flaky integration test',
        priority: 'MEDIUM',
      });
    const issueId = (created.body as IssueBody).id;

    const updated = await request(app.getHttpServer())
      .patch(`/issues/${issueId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(updated.status).toBe(200);
    expect((updated.body as IssueBody).status).toBe('IN_PROGRESS');

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'ISSUE_STATUS_CHANGED', projectId: orgAProjectId },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects logging an issue against a project from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/issues')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Cross-org attempt',
        priority: 'LOW',
      });
    expect(response.status).toBe(404);
  });
});
