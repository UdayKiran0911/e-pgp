import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, SopBody } from './test-types';

/**
 * Integration test: exercises SOP CRUD (org-level, not project-scoped),
 * RBAC, category filtering, and org isolation against a real Postgres
 * instance (see docker-compose.yml -> `postgres`). Run `docker compose up
 * -d postgres` before `pnpm test:integration`.
 */
describe('SOPs (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `SOPs Integration Org A ${suffix}`;
  const orgBName = `SOPs Integration Org B ${suffix}`;
  const orgAAdminEmail = `sop-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `sop-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `sop-org-a-member-${suffix}@acme.test`;
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
    await prisma.sop.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.user.deleteMany({
      where: { email: { in: [orgAAdminEmail, orgBAdminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await app.close();
  });

  it('lets an ADMIN create a SOP', async () => {
    const response = await request(app.getHttpServer())
      .post('/sops')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        title: 'Incident Response Runbook',
        category: 'Security',
        content: 'Step 1: page the on-call engineer...',
      });
    expect(response.status).toBe(201);
  });

  it('rejects a MEMBER creating a SOP but allows them to list and filter by category', async () => {
    await request(app.getHttpServer())
      .post('/sops')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        title: 'Deployment Checklist',
        category: 'Deployment',
        content: 'Step 1: run the pre-deploy checklist...',
      });

    const forbidden = await request(app.getHttpServer())
      .post('/sops')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Should fail', category: 'X', content: 'X' });
    expect(forbidden.status).toBe(403);

    const filtered = await request(app.getHttpServer())
      .get('/sops?category=Deployment')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(filtered.status).toBe(200);
    const body = filtered.body as SopBody[];
    expect(body.every((sop) => sop.category === 'Deployment')).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('does not let an org B admin see org A SOPs', async () => {
    const response = await request(app.getHttpServer())
      .get('/sops')
      .set('Authorization', `Bearer ${orgBAdminToken}`);
    expect(response.status).toBe(200);
    expect((response.body as SopBody[]).length).toBe(0);
  });
});
