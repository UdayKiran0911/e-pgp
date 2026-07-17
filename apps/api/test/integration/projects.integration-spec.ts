import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, ProjectBody } from './test-types';

/**
 * Integration test: exercises Project CRUD, status-transition validation,
 * RBAC, and org isolation against a real Postgres instance (see
 * docker-compose.yml -> `postgres`). Run `docker compose up -d postgres`
 * before `pnpm test:integration`.
 */
describe('Projects (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAAdminEmail = `projects-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `projects-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `projects-org-a-member-${suffix}@acme.test`;
  const password = 'super-secret-1';

  let orgAAdminToken: string;
  let orgBAdminToken: string;
  let memberToken: string;

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
        organizationName: `Projects Integration Org A ${suffix}`,
        name: 'Org A Admin',
        email: orgAAdminEmail,
        password,
      });
    orgAAdminToken = (orgA.body as AuthResponseBody).accessToken;

    const orgB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: `Projects Integration Org B ${suffix}`,
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
  });

  afterAll(async () => {
    const orgs = await prisma.organization.findMany({
      where: {
        name: {
          in: [
            `Projects Integration Org A ${suffix}`,
            `Projects Integration Org B ${suffix}`,
          ],
        },
      },
    });
    const orgIds = orgs.map((o) => o.id);
    const projects = await prisma.project.findMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.auditLog.deleteMany({
      where: { projectId: { in: projects.map((p) => p.id) } },
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

  it('lets an ADMIN create a project, defaulting to DRAFT', async () => {
    const response = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: 'Website Revamp' });

    expect(response.status).toBe(201);
    const body = response.body as ProjectBody;
    expect(body.name).toBe('Website Revamp');
    expect(body.status).toBe('DRAFT');
  });

  it('rejects a MEMBER creating a project but allows them to list projects', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Should Fail' });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get('/projects')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
    expect((list.body as ProjectBody[]).length).toBeGreaterThan(0);
  });

  it('applies a valid status transition and rejects an invalid one', async () => {
    const created = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: 'Governance Rollout' });
    const projectId = (created.body as ProjectBody).id;

    const invalid = await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'COMPLETED' }); // DRAFT -> COMPLETED is not allowed
    expect(invalid.status).toBe(400);

    const valid = await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'ACTIVE' }); // DRAFT -> ACTIVE is allowed
    expect(valid.status).toBe(200);
    expect((valid.body as ProjectBody).status).toBe('ACTIVE');
  });

  it('does not let an org B admin see or modify an org A project', async () => {
    const created = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: 'Org A Only Project' });
    const projectId = (created.body as ProjectBody).id;

    const crossOrgRead = await request(app.getHttpServer())
      .get(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${orgBAdminToken}`);
    expect(crossOrgRead.status).toBe(404);

    const crossOrgUpdate = await request(app.getHttpServer())
      .patch(`/projects/${projectId}`)
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({ status: 'ACTIVE' });
    expect(crossOrgUpdate.status).toBe(404);
  });
});
