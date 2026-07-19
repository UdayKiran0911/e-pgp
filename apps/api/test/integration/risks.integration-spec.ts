import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, ProjectBody, RiskBody } from './test-types';

/**
 * Integration test: exercises Risk Register CRUD, RBAC, and org isolation
 * against a real Postgres instance (see docker-compose.yml -> `postgres`).
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Risks (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Risks Integration Org A ${suffix}`;
  const orgBName = `Risks Integration Org B ${suffix}`;
  const orgAAdminEmail = `risks-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `risks-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `risks-org-a-member-${suffix}@acme.test`;
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
      .send({ name: 'Risk Register Test Project' });
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
    await prisma.risk.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.project.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [orgAAdminEmail, orgBAdminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await app.close();
  });

  it('lets a GOVERNANCE_LEAD-equivalent ADMIN log a risk against a project, defaulting to OPEN', async () => {
    const response = await request(app.getHttpServer())
      .post('/risks')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Vendor lock-in',
        severity: 'HIGH',
        likelihood: 'MEDIUM',
      });

    expect(response.status).toBe(201);
    const body = response.body as RiskBody;
    expect(body.title).toBe('Vendor lock-in');
    expect(body.status).toBe('OPEN');
  });

  it('rejects a MEMBER logging a risk but allows them to list risks', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/risks')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Should fail',
        severity: 'LOW',
        likelihood: 'LOW',
      });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get(`/risks?projectId=${orgAProjectId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
    expect((list.body as RiskBody[]).length).toBeGreaterThan(0);
  });

  it('updates a risk status and writes a RISK_STATUS_CHANGED audit log entry', async () => {
    const created = await request(app.getHttpServer())
      .post('/risks')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Key person dependency',
        severity: 'MEDIUM',
        likelihood: 'MEDIUM',
      });
    const riskId = (created.body as RiskBody).id;

    const updated = await request(app.getHttpServer())
      .patch(`/risks/${riskId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'MITIGATED' });
    expect(updated.status).toBe(200);
    expect((updated.body as RiskBody).status).toBe('MITIGATED');

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'RISK_STATUS_CHANGED', projectId: orgAProjectId },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects logging a risk against a project from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/risks')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Cross-org attempt',
        severity: 'LOW',
        likelihood: 'LOW',
      });
    expect(response.status).toBe(404);
  });
});
