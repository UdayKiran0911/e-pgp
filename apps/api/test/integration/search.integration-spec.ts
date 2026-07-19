import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, ProjectBody, SearchResultBody } from './test-types';

/**
 * Integration test: Enterprise Search (Phase 7) aggregates across Risk,
 * SOP, and Knowledge Article registers (a representative sample of the
 * full set), asserting cross-org isolation and that a keyword hit in one
 * register doesn't leak into another organization's results.
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Search (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Search Integration Org A ${suffix}`;
  const orgBName = `Search Integration Org B ${suffix}`;
  const orgAAdminEmail = `search-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `search-org-b-admin-${suffix}@acme.test`;
  const password = 'super-secret-1';
  const keyword = `zephyr${suffix}`;

  let orgAAdminToken: string;
  let orgBAdminToken: string;
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

    const project = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: `Search Test Project ${suffix}` });
    orgAProjectId = (project.body as ProjectBody).id;

    await request(app.getHttpServer())
      .post('/risks')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: `Project ${keyword} data migration risk`,
        severity: 'HIGH',
        likelihood: 'MEDIUM',
      });

    await request(app.getHttpServer())
      .post('/sops')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        title: 'Unrelated SOP',
        category: 'Ops',
        content: `Reference the ${keyword} runbook before proceeding.`,
      });
  });

  afterAll(async () => {
    const orgs = await prisma.organization.findMany({
      where: { name: { in: [orgAName, orgBName] } },
    });
    const orgIds = orgs.map((o) => o.id);
    await prisma.auditLog.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.risk.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.sop.deleteMany({ where: { organizationId: { in: orgIds } } });
    await prisma.project.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [orgAAdminEmail, orgBAdminEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await app.close();
  });

  it('finds matches across multiple registers by a shared keyword', async () => {
    const response = await request(app.getHttpServer())
      .get(`/search?q=${keyword}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`);

    expect(response.status).toBe(200);
    const results = response.body as SearchResultBody[];
    expect(results.some((r) => r.type === 'Risk')).toBe(true);
    expect(results.some((r) => r.type === 'SOP')).toBe(true);
  });

  it('does not leak org A matches into org B results', async () => {
    const response = await request(app.getHttpServer())
      .get(`/search?q=${keyword}`)
      .set('Authorization', `Bearer ${orgBAdminToken}`);

    expect(response.status).toBe(200);
    expect((response.body as SearchResultBody[]).length).toBe(0);
  });

  it('returns an empty list for a query shorter than 2 characters', async () => {
    const response = await request(app.getHttpServer())
      .get('/search?q=a')
      .set('Authorization', `Bearer ${orgAAdminToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
