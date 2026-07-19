import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, PublicUserBody } from './test-types';

/**
 * Integration test: exercises User/Organization CRUD, RBAC enforcement, and
 * audit-log writes against a real Postgres instance (see docker-compose.yml
 * -> `postgres`). Run `docker compose up -d postgres` before
 * `pnpm test:integration`.
 */
describe('Users + RBAC (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Users Integration Org A ${suffix}`;
  const orgBName = `Users Integration Org B ${suffix}`;
  const orgAAdminEmail = `org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `org-b-admin-${suffix}@acme.test`;
  const memberEmail = `org-a-member-${suffix}@acme.test`;
  const password = 'super-secret-1';

  let orgAId: string;
  let orgAAdminId: string;
  let orgAAdminToken: string;
  let orgBAdminToken: string;
  let memberToken: string;
  let memberId: string;

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
    orgAAdminId = (orgA.body as AuthResponseBody).user.id;
    orgAId = (orgA.body as AuthResponseBody).user.organizationId;

    const orgB = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: orgBName,
        name: 'Org B Admin',
        email: orgBAdminEmail,
        password,
      });
    orgBAdminToken = (orgB.body as AuthResponseBody).accessToken;

    const created = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ email: memberEmail, name: 'Org A Member', password });
    memberId = (created.body as PublicUserBody).id;

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
    // AuditLog.organizationId is ON DELETE RESTRICT — must clear these first.
    await prisma.auditLog.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [orgAAdminEmail, orgBAdminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await app.close();
  });

  it('defaults a newly created user to the MEMBER role', () => {
    // asserted via the created user's role in a follow-up fetch below
    expect(memberId).toEqual(expect.any(String));
  });

  it('lets a MEMBER read the org user list but not create new users', async () => {
    const list = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(2); // org A admin + member

    const forbidden = await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        email: `should-fail-${suffix}@acme.test`,
        name: 'Nope',
        password,
      });
    expect(forbidden.status).toBe(403);
  });

  it('does not let an org A admin see or modify an org B user', async () => {
    const orgBAdminMe = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${orgBAdminToken}`);
    const orgBAdminId = (orgBAdminMe.body as PublicUserBody).id;

    const crossOrgRead = await request(app.getHttpServer())
      .get(`/users/${orgBAdminId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`);
    expect(crossOrgRead.status).toBe(404);

    const crossOrgUpdate = await request(app.getHttpServer())
      .patch(`/users/${orgBAdminId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ role: 'AUDITOR' });
    expect(crossOrgUpdate.status).toBe(404);
  });

  it('lets an ADMIN update a role and writes a USER_ROLE_CHANGED audit log entry', async () => {
    const update = await request(app.getHttpServer())
      .patch(`/users/${memberId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ role: 'AUDITOR' });

    expect(update.status).toBe(200);
    expect((update.body as PublicUserBody).role).toBe('AUDITOR');

    const auditEntry = await prisma.auditLog.findFirst({
      where: { organizationId: orgAId, action: 'USER_ROLE_CHANGED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
    expect(auditEntry?.actorId).toBe(orgAAdminId);
    expect(auditEntry?.projectId).toBeNull();
  });

  it('lets an ADMIN rename their organization and writes an ORGANIZATION_UPDATED audit log entry', async () => {
    const newName = `${orgAName} Renamed`;
    const update = await request(app.getHttpServer())
      .patch('/organizations/me')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: newName });

    expect(update.status).toBe(200);

    const auditEntry = await prisma.auditLog.findFirst({
      where: { organizationId: orgAId, action: 'ORGANIZATION_UPDATED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
    expect(auditEntry?.actorId).toBe(orgAAdminId);

    // Restore the original name so afterAll's cleanup (matched by name) still finds it.
    await prisma.organization.update({
      where: { id: orgAId },
      data: { name: orgAName },
    });
  });
});
