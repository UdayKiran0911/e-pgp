import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, WebhookConnectorBody } from './test-types';

/**
 * Integration test: Webhook Connectors (Phase 8 Module 4) against a real
 * Postgres instance — ADMIN-only CRUD, and (most importantly) that the raw
 * URL is never present in any API response and is genuinely encrypted at
 * rest in the database.
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Webhook Connectors (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgName = `Webhooks Integration Org ${suffix}`;
  const adminEmail = `webhook-org-admin-${suffix}@acme.test`;
  const memberEmail = `webhook-org-member-${suffix}@acme.test`;
  const password = 'super-secret-1';
  const secretUrl = `https://hooks.slack.com/services/${suffix}`;

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
    await prisma.webhookConnector.deleteMany({
      where: { organizationId: orgId },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await app.close();
  });

  it('rejects a MEMBER creating a webhook connector', async () => {
    const response = await request(app.getHttpServer())
      .post('/webhook-connectors')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Ops Slack', provider: 'SLACK', url: secretUrl });
    expect(response.status).toBe(403);
  });

  it('lets an ADMIN create a webhook connector, never returning the raw URL, and encrypts it at rest', async () => {
    const response = await request(app.getHttpServer())
      .post('/webhook-connectors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ops Slack', provider: 'SLACK', url: secretUrl });

    expect(response.status).toBe(201);
    const body = response.body as WebhookConnectorBody;
    expect(body).not.toHaveProperty('url');
    expect(body).not.toHaveProperty('encryptedUrl');
    expect(JSON.stringify(body)).not.toContain(secretUrl);

    const row = await prisma.webhookConnector.findUnique({
      where: { id: body.id },
    });
    expect(row?.encryptedUrl).toBeDefined();
    expect(row?.encryptedUrl).not.toContain(secretUrl);

    const list = await request(app.getHttpServer())
      .get('/webhook-connectors')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(JSON.stringify(list.body)).not.toContain(secretUrl);
  });
});
