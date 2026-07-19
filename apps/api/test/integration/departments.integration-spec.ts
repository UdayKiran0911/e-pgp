import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, DepartmentBody } from './test-types';

/**
 * Integration test: exercises Department CRUD (org-level, not
 * project-scoped), ADMIN-only write RBAC, cycle prevention, and org
 * isolation against a real Postgres instance (see docker-compose.yml ->
 * `postgres`). Run `docker compose up -d postgres` before
 * `pnpm test:integration`.
 */
describe('Departments (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Departments Integration Org A ${suffix}`;
  const orgBName = `Departments Integration Org B ${suffix}`;
  const orgAAdminEmail = `dept-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `dept-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `dept-org-a-member-${suffix}@acme.test`;
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
    await prisma.department.deleteMany({
      where: { organizationId: { in: orgIds } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: [orgAAdminEmail, orgBAdminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: { in: orgIds } } });
    await app.close();
  });

  it('lets an ADMIN create a top-level department and a child department', async () => {
    const engineering = await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: 'Engineering' });
    expect(engineering.status).toBe(201);

    const engineeringId = (engineering.body as DepartmentBody).id;
    const backend = await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: 'Backend', parentId: engineeringId });
    expect(backend.status).toBe(201);
    expect((backend.body as DepartmentBody).parentId).toBe(engineeringId);
  });

  it('rejects a MEMBER creating a department but allows them to list departments', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Should fail' });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get('/departments')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
    expect((list.body as DepartmentBody[]).length).toBeGreaterThan(0);
  });

  it('rejects reparenting a department under its own descendant', async () => {
    const parent = await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: 'Product' });
    const parentId = (parent.body as DepartmentBody).id;

    const child = await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: 'Design', parentId });
    const childId = (child.body as DepartmentBody).id;

    const response = await request(app.getHttpServer())
      .patch(`/departments/${parentId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ parentId: childId });
    expect(response.status).toBe(400);
  });

  it('rejects creating a department against a parent from a different organization', async () => {
    const orgADept = await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ name: 'Org A Only Dept' });
    const orgADeptId = (orgADept.body as DepartmentBody).id;

    const response = await request(app.getHttpServer())
      .post('/departments')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({ name: 'Cross-org attempt', parentId: orgADeptId });
    expect(response.status).toBe(404);
  });
});
