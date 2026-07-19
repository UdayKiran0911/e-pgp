import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  AuthResponseBody,
  CustomerSignoffBody,
  ProjectBody,
} from './test-types';

/**
 * Integration test: exercises Customer Sign-off CRUD (write-gated to
 * ADMIN/GOVERNANCE_LEAD, unlike Change Requests/Reviews which are
 * self-serve), RBAC, and org isolation against a real Postgres instance
 * (see docker-compose.yml -> `postgres`). Run `docker compose up -d
 * postgres` before `pnpm test:integration`.
 */
describe('Customer Sign-offs (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Signoffs Integration Org A ${suffix}`;
  const orgBName = `Signoffs Integration Org B ${suffix}`;
  const orgAAdminEmail = `signoff-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `signoff-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `signoff-org-a-member-${suffix}@acme.test`;
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
      .send({ name: 'Customer Sign-off Test Project' });
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
    await prisma.customerSignoff.deleteMany({
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

  it('lets an ADMIN request a customer sign-off, defaulting to PENDING', async () => {
    const response = await request(app.getHttpServer())
      .post('/customer-signoffs')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Go-live approval',
        customerName: 'Acme Corp',
      });

    expect(response.status).toBe(201);
    expect((response.body as CustomerSignoffBody).status).toBe('PENDING');
  });

  it('rejects a MEMBER requesting a sign-off but allows them to list sign-offs', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/customer-signoffs')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Should fail',
        customerName: 'Acme Corp',
      });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get(`/customer-signoffs?projectId=${orgAProjectId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
    expect((list.body as CustomerSignoffBody[]).length).toBeGreaterThan(0);
  });

  it('records a received sign-off and writes a CUSTOMER_SIGNOFF_STATUS_CHANGED audit log entry', async () => {
    const created = await request(app.getHttpServer())
      .post('/customer-signoffs')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'UAT sign-off',
        customerName: 'Acme Corp',
      });
    const signoffId = (created.body as CustomerSignoffBody).id;

    const updated = await request(app.getHttpServer())
      .patch(`/customer-signoffs/${signoffId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'RECEIVED' });
    expect(updated.status).toBe(200);
    expect((updated.body as CustomerSignoffBody).status).toBe('RECEIVED');

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        action: 'CUSTOMER_SIGNOFF_STATUS_CHANGED',
        projectId: orgAProjectId,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects requesting a sign-off against a project from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/customer-signoffs')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Cross-org attempt',
        customerName: 'Acme Corp',
      });
    expect(response.status).toBe(404);
  });
});
