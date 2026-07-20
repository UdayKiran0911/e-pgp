import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AnalyticsOverviewBody, AuthResponseBody } from './test-types';

/**
 * Integration test: Analytics (Phase 7 Module 8) against a real Postgres
 * instance — response shape and RBAC (MEMBER excluded).
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Analytics (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgName = `Analytics Integration Org ${suffix}`;
  const adminEmail = `analytics-org-admin-${suffix}@acme.test`;
  const memberEmail = `analytics-org-member-${suffix}@acme.test`;
  const password = 'super-secret-1';

  let adminToken: string;
  let memberToken: string;
  let orgId: string;

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

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: memberEmail, name: 'Org Member', password });
    const memberLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: memberEmail, password });
    memberToken = (memberLogin.body as AuthResponseBody).accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await app.close();
  });

  it('returns a full overview shape for an org with no data yet', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const body = response.body as AnalyticsOverviewBody;
    expect(body.governanceHealth.averageScore).toBe(100);
    expect(body.auditReadiness.gateCompletionRate).toBe(1);
    expect(body.adoption.risks).toEqual({ total: 0, last30Days: 0 });
  });

  it('rejects a MEMBER reading analytics', async () => {
    const response = await request(app.getHttpServer())
      .get('/analytics/overview')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(response.status).toBe(403);
  });
});
