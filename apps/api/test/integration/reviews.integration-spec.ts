import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, ProjectBody, ReviewBody } from './test-types';

/**
 * Integration test: exercises the Review approval workflow (Architecture/
 * Security/Performance reviews share this one endpoint, distinguished by
 * `type`) — a MEMBER can submit but only ADMIN/GOVERNANCE_LEAD can decide —
 * plus org isolation, against a real Postgres instance (see
 * docker-compose.yml -> `postgres`). Run `docker compose up -d postgres`
 * before `pnpm test:integration`.
 */
describe('Reviews (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Reviews Integration Org A ${suffix}`;
  const orgBName = `Reviews Integration Org B ${suffix}`;
  const orgAAdminEmail = `review-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `review-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `review-org-a-member-${suffix}@acme.test`;
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
      .send({ name: 'Review Test Project' });
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
    await prisma.review.deleteMany({
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

  it('lets a MEMBER submit a security review, defaulting to SUBMITTED', async () => {
    const response = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: orgAProjectId,
        type: 'SECURITY',
        title: 'Pen-test the auth flow',
      });

    expect(response.status).toBe(201);
    const body = response.body as ReviewBody;
    expect(body.status).toBe('SUBMITTED');
    expect(body.type).toBe('SECURITY');
  });

  it('rejects a MEMBER deciding a review but allows an ADMIN to send it back for changes', async () => {
    const created = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: orgAProjectId,
        type: 'ARCHITECTURE',
        title: 'Evaluate service mesh',
      });
    const reviewId = (created.body as ReviewBody).id;

    const forbidden = await request(app.getHttpServer())
      .patch(`/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'CHANGES_REQUESTED' });
    expect(forbidden.status).toBe(403);

    const changesRequested = await request(app.getHttpServer())
      .patch(`/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'CHANGES_REQUESTED' });
    expect(changesRequested.status).toBe(200);

    const resubmitted = await request(app.getHttpServer())
      .patch(`/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'SUBMITTED' });
    expect(resubmitted.status).toBe(200);

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'REVIEW_STATUS_CHANGED', projectId: orgAProjectId },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects moving a review straight from CHANGES_REQUESTED to APPROVED', async () => {
    const created = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: orgAProjectId,
        type: 'PERFORMANCE',
        title: 'Load test the API',
      });
    const reviewId = (created.body as ReviewBody).id;

    await request(app.getHttpServer())
      .patch(`/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'CHANGES_REQUESTED' });

    const response = await request(app.getHttpServer())
      .patch(`/reviews/${reviewId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ status: 'APPROVED' });
    expect(response.status).toBe(400);
  });

  it('rejects submitting a review against a project from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/reviews')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({
        projectId: orgAProjectId,
        type: 'SECURITY',
        title: 'Cross-org attempt',
      });
    expect(response.status).toBe(404);
  });
});
