import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  AuthResponseBody,
  GovernanceGateBody,
  ProjectBody,
} from './test-types';

/**
 * Integration test: exercises Governance Gate CRUD + toggle (Development/
 * Testing governance share this one endpoint, distinguished by
 * `category`), RBAC, and org isolation against a real Postgres instance
 * (see docker-compose.yml -> `postgres`). Run `docker compose up -d
 * postgres` before `pnpm test:integration`.
 */
describe('Governance Gates (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Gates Integration Org A ${suffix}`;
  const orgBName = `Gates Integration Org B ${suffix}`;
  const orgAAdminEmail = `gate-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `gate-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `gate-org-a-member-${suffix}@acme.test`;
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
      .send({ name: 'Governance Gate Test Project' });
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
    await prisma.governanceGate.deleteMany({
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

  it('lets an ADMIN add a development gate, defaulting to not met', async () => {
    const response = await request(app.getHttpServer())
      .post('/governance-gates')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        category: 'DEVELOPMENT',
        title: 'Code review completed',
      });

    expect(response.status).toBe(201);
    expect((response.body as GovernanceGateBody).isMet).toBe(false);
  });

  it('rejects a MEMBER adding a gate but allows them to list gates', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/governance-gates')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: orgAProjectId,
        category: 'TESTING',
        title: 'Should fail',
      });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get(`/governance-gates?projectId=${orgAProjectId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
    expect((list.body as GovernanceGateBody[]).length).toBeGreaterThan(0);
  });

  it('marks a testing gate met and writes a GOVERNANCE_GATE_TOGGLED audit log entry', async () => {
    const created = await request(app.getHttpServer())
      .post('/governance-gates')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        category: 'TESTING',
        title: 'Coverage threshold met',
      });
    const gateId = (created.body as GovernanceGateBody).id;

    const updated = await request(app.getHttpServer())
      .patch(`/governance-gates/${gateId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ isMet: true });
    expect(updated.status).toBe(200);
    expect((updated.body as GovernanceGateBody).isMet).toBe(true);

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'GOVERNANCE_GATE_TOGGLED', projectId: orgAProjectId },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects adding a gate against a project from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/governance-gates')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({
        projectId: orgAProjectId,
        category: 'DEVELOPMENT',
        title: 'Cross-org attempt',
      });
    expect(response.status).toBe(404);
  });
});
