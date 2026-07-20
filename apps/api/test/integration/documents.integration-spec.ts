import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  AuthResponseBody,
  DocumentBody,
  DocumentVersionBody,
  ProjectBody,
} from './test-types';

/**
 * Integration test: exercises Document CRUD (link-based, project-scoped),
 * RBAC, and org isolation against a real Postgres instance (see
 * docker-compose.yml -> `postgres`). Run `docker compose up -d postgres`
 * before `pnpm test:integration`.
 */
describe('Documents (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgAName = `Documents Integration Org A ${suffix}`;
  const orgBName = `Documents Integration Org B ${suffix}`;
  const orgAAdminEmail = `doc-org-a-admin-${suffix}@acme.test`;
  const orgBAdminEmail = `doc-org-b-admin-${suffix}@acme.test`;
  const memberEmail = `doc-org-a-member-${suffix}@acme.test`;
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
      .send({ name: 'Document Test Project' });
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
    await prisma.document.deleteMany({
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

  it('lets an ADMIN add a document, defaulting to version 1.0', async () => {
    const response = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Solution Design Doc',
        url: 'https://docs.example.com/solution-design',
      });

    expect(response.status).toBe(201);
    expect((response.body as DocumentBody).version).toBe('1.0');
  });

  it('rejects a MEMBER adding a document but allows them to list documents', async () => {
    const forbidden = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Should fail',
        url: 'https://docs.example.com/should-fail',
      });
    expect(forbidden.status).toBe(403);

    const list = await request(app.getHttpServer())
      .get(`/documents?projectId=${orgAProjectId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(list.status).toBe(200);
    expect((list.body as DocumentBody[]).length).toBeGreaterThan(0);
  });

  it('bumps a document version and writes a DOCUMENT_UPDATED audit log entry', async () => {
    const created = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'API Contract',
        url: 'https://docs.example.com/api-contract',
      });
    const documentId = (created.body as DocumentBody).id;

    const updated = await request(app.getHttpServer())
      .patch(`/documents/${documentId}`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .send({ version: '2.0' });
    expect(updated.status).toBe(200);
    expect((updated.body as DocumentBody).version).toBe('2.0');

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'DOCUMENT_UPDATED', projectId: orgAProjectId },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects adding a document against a project from a different organization', async () => {
    const response = await request(app.getHttpServer())
      .post('/documents')
      .set('Authorization', `Bearer ${orgBAdminToken}`)
      .send({
        projectId: orgAProjectId,
        title: 'Cross-org attempt',
        url: 'https://docs.example.com/cross-org',
      });
    expect(response.status).toBe(404);
  });

  it('uploads a real file to local disk and downloads it back byte-for-byte', async () => {
    const fileContents = Buffer.from('%PDF-1.4 fake pdf contents for a test');

    const uploaded = await request(app.getHttpServer())
      .post('/documents/upload')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .field('projectId', orgAProjectId)
      .field('title', 'Uploaded Runbook')
      .attach('file', fileContents, 'runbook.pdf');

    expect(uploaded.status).toBe(201);
    const body = uploaded.body as DocumentBody & { storageKey?: string };
    expect(body.storageKey).toBeTruthy();
    expect(body.url).toBe(`/documents/${body.id}/download`);

    const downloaded = await request(app.getHttpServer())
      .get(body.url)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });
    expect(downloaded.status).toBe(200);
    expect(downloaded.headers['content-disposition']).toContain(
      'Uploaded Runbook',
    );
    expect(Buffer.compare(downloaded.body as Buffer, fileContents)).toBe(0);
  });

  it('rejects a MEMBER uploading a file', async () => {
    const response = await request(app.getHttpServer())
      .post('/documents/upload')
      .set('Authorization', `Bearer ${memberToken}`)
      .field('projectId', orgAProjectId)
      .field('title', 'Should fail')
      .attach('file', Buffer.from('x'), 'x.txt');
    expect(response.status).toBe(403);
  });

  it('re-uploads a new version, snapshotting the prior one into version history', async () => {
    const uploaded = await request(app.getHttpServer())
      .post('/documents/upload')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .field('projectId', orgAProjectId)
      .field('title', 'Versioned Runbook')
      .field('version', '1.0')
      .attach('file', Buffer.from('v1 contents'), 'runbook-v1.pdf');
    const documentId = (uploaded.body as DocumentBody).id;
    const v1StorageKey = (uploaded.body as DocumentBody).storageKey;

    const reuploaded = await request(app.getHttpServer())
      .post(`/documents/${documentId}/reupload`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .field('version', '2.0')
      .attach('file', Buffer.from('v2 contents'), 'runbook-v2.pdf');
    expect(reuploaded.status).toBe(201);
    const reuploadedBody = reuploaded.body as DocumentBody;
    expect(reuploadedBody.version).toBe('2.0');
    expect(reuploadedBody.storageKey).not.toBe(v1StorageKey);

    const versions = await request(app.getHttpServer())
      .get(`/documents/${documentId}/versions`)
      .set('Authorization', `Bearer ${orgAAdminToken}`);
    expect(versions.status).toBe(200);
    const versionList = versions.body as DocumentVersionBody[];
    expect(versionList).toHaveLength(1);
    expect(versionList[0].version).toBe('1.0');
    expect(versionList[0].storageKey).toBe(v1StorageKey);

    const downloaded = await request(app.getHttpServer())
      .get(`/documents/${documentId}/download`)
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });
    expect(
      Buffer.compare(downloaded.body as Buffer, Buffer.from('v2 contents')),
    ).toBe(0);

    const auditEntry = await prisma.auditLog.findFirst({
      where: { action: 'DOCUMENT_REUPLOADED', projectId: orgAProjectId },
      orderBy: { createdAt: 'desc' },
    });
    expect(auditEntry).not.toBeNull();
  });

  it('rejects a MEMBER re-uploading a document', async () => {
    const uploaded = await request(app.getHttpServer())
      .post('/documents/upload')
      .set('Authorization', `Bearer ${orgAAdminToken}`)
      .field('projectId', orgAProjectId)
      .field('title', 'RBAC Reupload Test')
      .attach('file', Buffer.from('v1'), 'x.pdf');
    const documentId = (uploaded.body as DocumentBody).id;

    const response = await request(app.getHttpServer())
      .post(`/documents/${documentId}/reupload`)
      .set('Authorization', `Bearer ${memberToken}`)
      .attach('file', Buffer.from('v2'), 'x.pdf');
    expect(response.status).toBe(403);
  });
});
