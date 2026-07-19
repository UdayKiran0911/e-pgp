import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  AuditLogBody,
  AuthResponseBody,
  ProjectBody,
  PublicUserBody,
} from './test-types';

/**
 * Integration test: exercises the audit log viewer endpoint — RBAC
 * (ADMIN/GOVERNANCE_LEAD/AUDITOR only, MEMBER excluded) and org isolation —
 * against a real Postgres instance (see docker-compose.yml -> `postgres`).
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Audit Logs (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Audit Log Integration Org A ${suffix}`;
  const orgBName = `Audit Log Integration Org B ${suffix}`;
  const orgAAdminEmail = `audit-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `audit-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `audit-org-a-member-${suffix}@acme.test`;
  const auditorEmail = `audit-org-a-auditor-${suffix}@acme.test`;
  const password = 'super-secret-1';

  let orgAId: string;
  let orgAAdminToken: string;
  let orgBAdminToken: string;
  let memberToken: string;
  let auditorToken: string;
  let projectId: string;

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
    orgAId = (orgA.body as AuthResponseBody).user.organizationId;

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

    const auditorCreated = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        email: auditorEmail,
        name: 'Org A Auditor',
        password,
        role: 'AUDITOR',
      });
    expect((auditorCreated.body as PublicUserBody).role).toBe('AUDITOR');
    const auditorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: auditorEmail, password });
    auditorToken = (auditorLogin.body as AuthResponseBody).accessToken;

    const created = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: 'Audit Log Test Project' });
    projectId = (created.body as ProjectBody).id;
  });

  afterAll(async () => {
    const orgs = await prisma.organization.findMany({
      where: { name: { in: [orgAName, orgBName] } },
    });
    const orgIds = orgs.map((o) => o.id);
    await prisma.auditLog.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.project.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [orgAAdminEmail, orgBAdminEmail, memberEmail, auditorEmail],
        },
      },
    });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await app.close();
  });

  it('lets an ADMIN see the PROJECT_CREATED entry, newest first, with the project name attached', async () => {
    const response = await request(app.getHttpServer())
      .get('/audit-logs')
      .set('Authorization', `Bearer ${orgAAdminToken}`);

    expect(response.status).toBe(200);
    const body = response.body as AuditLogBody[];
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((entry) => entry.organizationId === orgAId)).toBe(true);

    const created = body.find(
      (entry) =>
        entry.action === 'PROJECT_CREATED' && entry.projectId === projectId,
    );
    expect(created).toBeDefined();
    expect(created?.project?.name).toBe('Audit Log Test Project');
  });

  it('lets an AUDITOR read the audit log', async () => {
    const response = await request(app.getHttpServer())
      .get('/audit-logs')
      .set('Authorization', `Bearer ${auditorToken}`);

    expect(response.status).toBe(200);
  });

  it('rejects a MEMBER reading the audit log', async () => {
    const response = await request(app.getHttpServer())
      .get('/audit-logs')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(response.status).toBe(403);
  });

  it('does not let an org B admin see org A audit log entries', async () => {
    const response = await request(app.getHttpServer())
      .get('/audit-logs')
      .set('Authorization', `Bearer ${orgBAdminToken}`);

    expect(response.status).toBe(200);
    const body = response.body as AuditLogBody[];
    expect(body.some((entry) => entry.organizationId === orgAId)).toBe(false);
  });
});
