import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  AuthResponseBody,
  ProjectBody,
  SecurityFindingBody,
} from './test-types';

/**
 * Integration test: Security Findings (Vulnerability Management, Phase 9)
 * against a real Postgres instance — CRUD, RBAC, project ownership, and
 * org isolation, same shape as Risk/Issue registers.
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Security Findings (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Findings Integration Org A ${suffix}`;
  const orgBName = `Findings Integration Org B ${suffix}`;
  const orgAAdminEmail = `finding-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `finding-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `finding-org-a-member-${suffix}@acme.test`;
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
      .send({ name: 'Security Findings Test Project' });
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
    await prisma.securityFinding.deleteMany({
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

  it('rejects a MEMBER logging a finding but allows them to list findings', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/security-findings')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Should fail',
        severity: 'HIGH',
      });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get(`/security-findings?projectId=${orgAProjectId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
  });

  it('lets an ADMIN log a finding, defaulting to OPEN, and update its status', async () => {
    const created = await request(app.getHttpServer())
      .post('/security-findings')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Outdated TLS cipher suite',
        severity: 'HIGH',
      });
    expect(created.status).toBe(201);
    expect((created.body as SecurityFindingBody).status).toBe('OPEN');
    const findingId = (created.body as SecurityFindingBody).id;

    const updated = await request(app.getHttpServer())
      .patch(`/security-findings/${findingId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'IN_REMEDIATION' });
    expect(updated.status).toBe(200);
    expect((updated.body as SecurityFindingBody).status).toBe('IN_REMEDIATION');

    const auditEntry = await prisma.auditLog.findFirst({
      where: {
        action: 'SECURITY_FINDING_STATUS_CHANGED',
        projectId: orgAProjectId,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects logging a finding against a project from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/security-findings')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Cross-org attempt',
        severity: 'LOW',
      });
    expect(response.status).toBe(404);
  });
});
