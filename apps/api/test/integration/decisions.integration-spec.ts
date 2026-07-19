import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, DecisionBody, ProjectBody } from './test-types';

/**
 * Integration test: exercises Decision Log CRUD, RBAC, and org isolation
 * against a real Postgres instance (see docker-compose.yml -> `postgres`).
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Decisions (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Decisions Integration Org A ${suffix}`;
  const orgBName = `Decisions Integration Org B ${suffix}`;
  const orgAAdminEmail = `decisions-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `decisions-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `decisions-org-a-member-${suffix}@acme.test`;
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
      .send({ name: 'Decision Log Test Project' });
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
    await prisma.decision.deleteMany({
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

  it('lets an ADMIN log a decision against a project', async () => {
    const response = await request(app.getHttpServer())
      .post('/decisions')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Adopt Postgres over MySQL',
        decision: 'Go with Postgres',
      });

    expect(response.status).toBe(201);
    const body = response.body as DecisionBody;
    expect(body.title).toBe('Adopt Postgres over MySQL');
  });

  it('rejects a MEMBER logging a decision but allows them to list decisions', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/decisions')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Should fail',
        decision: 'Should fail',
      });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get(`/decisions?projectId=${orgAProjectId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
    expect((list.body as DecisionBody[]).length).toBeGreaterThan(0);
  });

  it('updates a decision and writes a DECISION_UPDATED audit log entry', async () => {
    const created = await request(app.getHttpServer())
      .post('/decisions')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Use Neon for hosting',
        decision: 'Go with Neon',
      });
    const decisionId = (created.body as DecisionBody).id;

    const updated = await request(app.getHttpServer())
      .patch(`/decisions/${decisionId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ context: 'Serverless Postgres, generous free tier' });
    expect(updated.status).toBe(200);

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'DECISION_UPDATED', projectId: orgAProjectId },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects logging a decision against a project from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/decisions')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Cross-org attempt',
        decision: 'Should not work',
      });
    expect(response.status).toBe(404);
  });
});
