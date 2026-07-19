import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, KnowledgeArticleBody } from './test-types';

/**
 * Integration test: exercises Knowledge Repository CRUD (org-level, not
 * project-scoped), RBAC, category filtering, and org isolation against a
 * real Postgres instance (see docker-compose.yml -> `postgres`). Run
 * `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Knowledge Articles (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Knowledge Integration Org A ${suffix}`;
  const orgBName = `Knowledge Integration Org B ${suffix}`;
  const orgAAdminEmail = `knowledge-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `knowledge-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `knowledge-org-a-member-${suffix}@acme.test`;
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
    await prisma.knowledgeArticle.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [orgAAdminEmail, orgBAdminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await app.close();
  });

  it('lets a GOVERNANCE_LEAD-equivalent ADMIN create an article with tags', async () => {
    const response = await request(app.getHttpServer())
      .post('/knowledge-articles')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        title: 'Onboarding FAQ',
        category: 'Onboarding',
        tags: ['faq', 'new-hire'],
        content: 'Frequently asked questions for new hires...',
      });
    expect(response.status).toBe(201);
    expect((response.body as KnowledgeArticleBody).tags).toEqual([
      'faq',
      'new-hire',
    ]);
  });

  it('rejects a MEMBER creating an article but allows them to list and filter by category', async () => {
    await request(app.getHttpServer())
      .post('/knowledge-articles')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        title: 'Governance Retrospective',
        category: 'Retrospective',
        content: 'Lessons learned...',
      });

    const forbidden = await request(app.getHttpServer())
      .post('/knowledge-articles')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Should fail', category: 'X', content: 'X content' });
    expect(forbidden.status).toBe(403);

    const filtered = await request(app.getHttpServer())
      .get('/knowledge-articles?category=Retrospective')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(filtered.status).toBe(200);
    const body = filtered.body as KnowledgeArticleBody[];
    expect(body.every((a) => a.category === 'Retrospective')).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('does not let an org B admin see org A articles', async () => {
    const response = await request(app.getHttpServer())
      .get('/knowledge-articles')
      .set('Authorization', `Bearer ${orgBAdminToken}`);
    expect(response.status).toBe(200);
    expect((response.body as KnowledgeArticleBody[]).length).toBe(0);
  });
});
