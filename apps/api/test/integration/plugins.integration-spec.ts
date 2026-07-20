import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, PluginManifestBody } from './test-types';

/**
 * Integration test: Plugin Framework (Phase 8 Module 10) — a manifest
 * registry only (no execution sandbox), ADMIN-only write, org isolation.
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Plugins (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Plugins Integration Org A ${suffix}`;
  const orgBName = `Plugins Integration Org B ${suffix}`;
  const orgAAdminEmail = `plugin-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `plugin-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `plugin-org-a-member-${suffix}@acme.test`;
  const password = 'super-secret-1';

  let orgAAdminToken: string;
  let orgBAdminToken: string;
  let memberToken: string;

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
  });

  afterAll(async () => {
    const orgs = await prisma.organization.findMany({
      where: { name: { in: [orgAName, orgBName] } },
    });
    const orgIds = orgs.map((o) => o.id);
    await prisma.auditLog.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.pluginManifest.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [orgAAdminEmail, orgBAdminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await app.close();
  });

  it('rejects a MEMBER registering a plugin but allows them to list plugins', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/plugins')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'jira-sync', version: '1.0.0', manifest: {} });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get('/plugins')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
  });

  it('lets an ADMIN register and toggle a plugin manifest', async () => {
    const created = await request(app.getHttpServer())
      .post('/plugins')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        name: 'jira-sync',
        version: '1.0.0',
        manifest: { hooks: ['onIssueCreated'] },
      });
    expect(created.status).toBe(201);
    const pluginId = (created.body as PluginManifestBody).id;

    const toggled = await request(app.getHttpServer())
      .patch(`/plugins/${pluginId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ isEnabled: false });
    expect(toggled.status).toBe(200);
    expect((toggled.body as PluginManifestBody).isEnabled).toBe(false);
  });

  it('does not let an org B admin see org A plugins', async () => {
    const response = await request(app.getHttpServer())
      .get('/plugins')
      .set('Authorization', `Bearer ${orgBAdminToken}`);
    expect(response.status).toBe(200);
    expect((response.body as PluginManifestBody[]).length).toBe(0);
  });
});
