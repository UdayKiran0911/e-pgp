import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  AuthResponseBody,
  ProjectBody,
  ProjectHealthScoreBody,
} from './test-types';

/**
 * Integration test: Project Health Score (AI Risk Prediction stand-in,
 * Phase 7 Module 4) against a real Postgres instance — asserts the score
 * actually moves in response to real signals (an open critical risk).
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Project Health (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgName = `Health Integration Org ${suffix}`;
  const adminEmail = `health-org-admin-${suffix}@acme.test`;
  const password = 'super-secret-1';

  let adminToken: string;
  let orgId: string;
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

    const admin = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: orgName,
        name: 'Org Admin',
        email: adminEmail,
        password,
      });
    adminToken = (admin.body as AuthResponseBody).accessToken;
    orgId = (admin.body as AuthResponseBody).user.organizationId;

    const project = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Health Test Project ${suffix}` });
    projectId = (project.body as ProjectBody).id;
  });

  afterAll(async () => {
    await prisma.risk.deleteMany({ where: { organizationId: orgId } });
    await prisma.project.deleteMany({ where: { organizationId: orgId } });
    await prisma.user.deleteMany({ where: { email: adminEmail } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await app.close();
  });

  it('scores a clean project 100 and HEALTHY', async () => {
    const response = await request(app.getHttpServer())
      .get(`/projects/${projectId}/health-score`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const body = response.body as ProjectHealthScoreBody;
    expect(body.score).toBe(100);
    expect(body.band).toBe('HEALTHY');
  });

  it('drops the score after an open critical risk is logged', async () => {
    await request(app.getHttpServer())
      .post('/risks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        projectId,
        title: 'Unpatched CVE in dependency',
        severity: 'CRITICAL',
        likelihood: 'HIGH',
      });

    const response = await request(app.getHttpServer())
      .get(`/projects/${projectId}/health-score`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const body = response.body as ProjectHealthScoreBody;
    expect(body.score).toBeLessThan(100);
    expect(body.signals.openHighCriticalRisks).toBe(1);
  });

  it('returns 404 for a project outside the caller organization', async () => {
    const response = await request(app.getHttpServer())
      .get(`/projects/${crypto.randomUUID()}/health-score`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(404);
  });
});
