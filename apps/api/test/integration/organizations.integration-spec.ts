import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody } from './test-types';

/**
 * Integration test: Organization data export (Backup & Recovery stand-in,
 * Phase 9) against a real Postgres instance — ADMIN-only, and never leaks
 * a user's passwordHash.
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Organizations export (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgName = `Org Export Integration Org ${suffix}`;
  const adminEmail = `org-export-admin-${suffix}@acme.test`;
  const memberEmail = `org-export-member-${suffix}@acme.test`;
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
    await prisma.auditLog.deleteMany({ where: { organizationId: orgId } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await app.close();
  });

  it('rejects a MEMBER exporting organization data', async () => {
    const response = await request(app.getHttpServer())
      .get('/organizations/me/export')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(response.status).toBe(403);
  });

  it('lets an ADMIN export a full data snapshot without leaking passwordHash', async () => {
    const response = await request(app.getHttpServer())
      .get('/organizations/me/export')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect((response.body as { users: unknown[] }).users.length).toBe(2);

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'ORGANIZATION_DATA_EXPORTED', organizationId: orgId },
    });
    expect(auditEntry).not.toBeNull();
  });
});
