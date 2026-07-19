import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, ProjectBody, RequirementBody } from './test-types';

/**
 * Integration test: exercises Requirement CRUD, RBAC, and org isolation
 * against a real Postgres instance (see docker-compose.yml -> `postgres`).
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Requirements (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Requirements Integration Org A ${suffix}`;
  const orgBName = `Requirements Integration Org B ${suffix}`;
  const orgAAdminEmail = `req-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `req-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `req-org-a-member-${suffix}@acme.test`;
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
      .send({ name: 'Requirements Test Project' });
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
    await prisma.requirement.deleteMany({
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

  it('lets an ADMIN create a requirement, defaulting to DRAFT', async () => {
    const response = await request(app.getHttpServer())
      .post('/requirements')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ projectId: orgAProjectId, title: 'Support SSO login' });

    expect(response.status).toBe(201);
    const body = response.body as RequirementBody;
    expect(body.status).toBe('DRAFT');
  });

  it('rejects a MEMBER creating a requirement but allows them to list requirements', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/requirements')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId: orgAProjectId, title: 'Should fail' });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get(`/requirements?projectId=${orgAProjectId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
    expect((list.body as RequirementBody[]).length).toBeGreaterThan(0);
  });

  it('updates a requirement status and writes a REQUIREMENT_STATUS_CHANGED audit log entry', async () => {
    const created = await request(app.getHttpServer())
      .post('/requirements')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ projectId: orgAProjectId, title: 'Support MFA' });
    const requirementId = (created.body as RequirementBody).id;

    const updated = await request(app.getHttpServer())
      .patch(`/requirements/${requirementId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'APPROVED' });
    expect(updated.status).toBe(200);
    expect((updated.body as RequirementBody).status).toBe('APPROVED');

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'REQUIREMENT_STATUS_CHANGED', projectId: orgAProjectId },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects creating a requirement against a project from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/requirements')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({ projectId: orgAProjectId, title: 'Cross-org attempt' });
    expect(response.status).toBe(404);
  });
});
