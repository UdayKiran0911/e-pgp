import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, ChangeRequestBody, ProjectBody } from './test-types';

/**
 * Integration test: exercises the Change Request approval workflow — a
 * MEMBER can submit but only ADMIN/GOVERNANCE_LEAD can decide (approve/
 * reject/implement) — plus org isolation, against a real Postgres instance
 * (see docker-compose.yml -> `postgres`). Run `docker compose up -d
 * postgres` before `pnpm test:integration`.
 */
describe('Change Requests (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Change Requests Integration Org A ${suffix}`;
  const orgBName = `Change Requests Integration Org B ${suffix}`;
  const orgAAdminEmail = `cr-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `cr-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `cr-org-a-member-${suffix}@acme.test`;
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
      .send({ name: 'Change Request Test Project' });
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
    await prisma.notification.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.emailLog.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.changeRequest.deleteMany({
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

  it('lets a MEMBER submit a change request, defaulting to SUBMITTED', async () => {
    const response = await request(app.getHttpServer())
      .post('/change-requests')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId: orgAProjectId, title: 'Extend deployment window' });

    expect(response.status).toBe(201);
    const body = response.body as ChangeRequestBody;
    expect(body.status).toBe('SUBMITTED');
  });

  it('rejects a MEMBER approving a change request but allows an ADMIN to', async () => {
    const created = await request(app.getHttpServer())
      .post('/change-requests')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId: orgAProjectId, title: 'Add a staging environment' });
    const changeRequestId = (created.body as ChangeRequestBody).id;

    const forbidden = await request(app.getHttpServer())
      .patch(`/change-requests/${changeRequestId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'APPROVED' });
    expect(forbidden.status).toBe(403);

    const approved = await request(app.getHttpServer())
      .patch(`/change-requests/${changeRequestId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'APPROVED' });
    expect(approved.status).toBe(200);
    expect((approved.body as ChangeRequestBody).status).toBe('APPROVED');

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        action: 'CHANGE_REQUEST_STATUS_CHANGED',
        projectId: orgAProjectId,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();

    // The decision fans out through GovernanceNotifierService — the member
    // who submitted the change request should see an in-app notification
    // and an EmailLog entry (see Phase 8 Module 2).
    const notification = await prisma.notification.findFirst({
      where: { projectId: orgAProjectId, title: { contains: 'APPROVED' } },
      orderBy: { createdAt: 'desc' },
    });
    expect(notification).not.toBeNull();

    const emailLog = await prisma.emailLog.findFirst({
      where: { projectId: orgAProjectId, subject: { contains: 'APPROVED' } },
      orderBy: { createdAt: 'desc' },
    });
    expect(emailLog).not.toBeNull();
  });

  it('rejects skipping straight from SUBMITTED to IMPLEMENTED', async () => {
    const created = await request(app.getHttpServer())
      .post('/change-requests')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId: orgAProjectId, title: 'Skip-the-approval attempt' });
    const changeRequestId = (created.body as ChangeRequestBody).id;

    const response = await request(app.getHttpServer())
      .patch(`/change-requests/${changeRequestId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'IMPLEMENTED' });
    expect(response.status).toBe(400);
  });

  it('rejects submitting a change request against a project from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/change-requests')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({ projectId: orgAProjectId, title: 'Cross-org attempt' });
    expect(response.status).toBe(404);
  });
});
