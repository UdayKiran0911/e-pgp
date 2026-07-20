import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  AuthResponseBody,
  ChecklistItemBody,
  ChecklistTemplateBody,
  ProjectBody,
} from './test-types';

/**
 * Integration test: Checklist Templates (Phase 5 Module 9 templating
 * layer) against a real Postgres instance — org-level template CRUD and
 * the "apply to project" bulk-create against a real ChecklistItem set.
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Checklist Templates (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgName = `Templates Integration Org ${suffix}`;
  const adminEmail = `template-org-admin-${suffix}@acme.test`;
  const memberEmail = `template-org-member-${suffix}@acme.test`;
  const password = 'super-secret-1';

  let adminToken: string;
  let memberToken: string;
  let orgId: string;
  let projectId: string;

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

    const project = await request(app.getHttpServer())
      .post('/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `Templates Test Project ${suffix}` });
    projectId = (project.body as ProjectBody).id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { organizationId: orgId } });
    await prisma.checklistItem.deleteMany({ where: { organizationId: orgId } });
    await prisma.checklistTemplateItem.deleteMany({
      where: { template: { organizationId: orgId } },
    });
    await prisma.checklistTemplate.deleteMany({
      where: { organizationId: orgId },
    });
    await prisma.project.deleteMany({ where: { organizationId: orgId } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await app.close();
  });

  it('rejects a MEMBER creating a template', async () => {
    const response = await request(app.getHttpServer())
      .post('/checklist-templates')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Should fail', items: ['a'] });
    expect(response.status).toBe(403);
  });

  it('lets an ADMIN create a template with ordered items and apply it to a project', async () => {
    const created = await request(app.getHttpServer())
      .post('/checklist-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Pre-launch checklist',
        items: ['Confirm rollback plan', 'Notify stakeholders'],
      });
    expect(created.status).toBe(201);
    const templateBody = created.body as ChecklistTemplateBody;
    expect(templateBody.items.map((i) => i.title)).toEqual([
      'Confirm rollback plan',
      'Notify stakeholders',
    ]);

    const applied = await request(app.getHttpServer())
      .post(`/checklist-templates/${templateBody.id}/apply`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectId });
    expect(applied.status).toBe(201);
    const items = applied.body as ChecklistItemBody[];
    expect(items.some((i) => i.title === 'Confirm rollback plan')).toBe(true);
    expect(items.some((i) => i.title === 'Notify stakeholders')).toBe(true);

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'CHECKLIST_TEMPLATE_APPLIED', projectId },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects applying a template to a project from a different organization', async () => {
    const created = await request(app.getHttpServer())
      .post('/checklist-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Another template', items: ['Step 1'] });
    const templateId = (created.body as ChecklistTemplateBody).id;

    const response = await request(app.getHttpServer())
      .post(`/checklist-templates/${templateId}/apply`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ projectId: '00000000-0000-0000-0000-000000000000' });
    expect(response.status).toBe(404);
  });
});
