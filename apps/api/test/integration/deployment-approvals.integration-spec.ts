import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  AuthResponseBody,
  DeploymentApprovalBody,
  ProjectBody,
} from './test-types';

/**
 * Integration test: exercises Deployment Governance (Phase 6 Module 12)
 * against a real Postgres instance — the request/decide workflow, RBAC,
 * org isolation, and the code-enforced block on approving a deployment
 * while governance gates are unmet or customer sign-offs aren't received.
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Deployment Approvals (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Deploy Integration Org A ${suffix}`;
  const orgBName = `Deploy Integration Org B ${suffix}`;
  const orgAAdminEmail = `deploy-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `deploy-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `deploy-org-a-member-${suffix}@acme.test`;
  const password = 'super-secret-1';

  let orgAAdminToken: string;
  let orgBAdminToken: string;
  let memberToken: string;
  let memberUserId: string;
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
    memberUserId = (memberLogin.body as AuthResponseBody).user.id;

    const project = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: 'Deployment Governance Test Project' });
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
    await prisma.deploymentApproval.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.governanceGate.deleteMany({
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

  it('lets a MEMBER request a deployment approval, defaulting to REQUESTED', async () => {
    const response = await request(app.getHttpServer())
      .post('/deployment-approvals')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId: orgAProjectId, title: 'Ship v1.0' });

    expect(response.status).toBe(201);
    expect((response.body as DeploymentApprovalBody).status).toBe('REQUESTED');
  });

  it('rejects a MEMBER deciding a deployment approval', async () => {
    const created = await request(app.getHttpServer())
      .post('/deployment-approvals')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId: orgAProjectId, title: 'Ship v1.1' });
    const id = (created.body as DeploymentApprovalBody).id;

    const response = await request(app.getHttpServer())
      .patch(`/deployment-approvals/${id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'APPROVED' });
    expect(response.status).toBe(403);
  });

  it('blocks approval while a governance gate is unmet, then allows it once resolved, notifying the requester', async () => {
    const gate = await request(app.getHttpServer())
      .post('/governance-gates')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        category: 'TESTING',
        title: 'Coverage threshold met',
      });
    const gateId = (gate.body as { id: string }).id;

    const deployment = await request(app.getHttpServer())
      .post('/deployment-approvals')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ projectId: orgAProjectId, title: 'Ship v2.0' });
    const deploymentId = (deployment.body as DeploymentApprovalBody).id;

    const blockedAttempt = await request(app.getHttpServer())
      .patch(`/deployment-approvals/${deploymentId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'APPROVED' });
    expect(blockedAttempt.status).toBe(400);

    await request(app.getHttpServer())
      .patch(`/governance-gates/${gateId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ isMet: true });

    const approved = await request(app.getHttpServer())
      .patch(`/deployment-approvals/${deploymentId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'APPROVED' });
    expect(approved.status).toBe(200);
    expect((approved.body as DeploymentApprovalBody).status).toBe('APPROVED');

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        action: 'DEPLOYMENT_APPROVAL_STATUS_CHANGED',
        projectId: orgAProjectId,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();

    const notifications = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(notifications.status).toBe(200);
    expect(
      (notifications.body as { recipientId: string; title: string }[]).some(
        (n) => n.recipientId === memberUserId && n.title.includes('approved'),
      ),
    ).toBe(true);
  });

  it('rejects requesting a deployment approval against a project from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/deployment-approvals')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({ projectId: orgAProjectId, title: 'Cross-org attempt' });
    expect(response.status).toBe(404);
  });
});
