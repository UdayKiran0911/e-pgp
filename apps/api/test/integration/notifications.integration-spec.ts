import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, NotificationBody } from './test-types';

/**
 * Integration test: Notifications (Phase 8) are always system-generated
 * (no public create endpoint), so this seeds rows directly via Prisma and
 * exercises list-mine / mark-read / mark-all-read against a real Postgres
 * instance, asserting a recipient never sees another user's notifications
 * even within the same organization.
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Notifications (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const suffix = Date.now();
  const orgName = `Notifications Integration Org ${suffix}`;
  const adminEmail = `notif-org-admin-${suffix}@acme.test`;
  const memberEmail = `notif-org-member-${suffix}@acme.test`;
  const password = 'super-secret-1';

  let adminToken: string;
  let adminUserId: string;
  let memberToken: string;
  let memberUserId: string;
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
    adminUserId = (admin.body as AuthResponseBody).user.id;
    orgId = (admin.body as AuthResponseBody).user.organizationId;

    await request(app.getHttpServer())
      .post('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: memberEmail, name: 'Org Member', password });
    const memberLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: memberEmail, password });
    memberToken = (memberLogin.body as AuthResponseBody).accessToken;
    memberUserId = (memberLogin.body as AuthResponseBody).user.id;

    await prisma.notification.createMany({
      data: [
        { organizationId: orgId, recipientId: adminUserId, title: 'For admin' },
        {
          organizationId: orgId,
          recipientId: memberUserId,
          title: 'For member',
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({ where: { organizationId: orgId } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminEmail, memberEmail] } },
    });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await app.close();
  });

  it('only lists notifications addressed to the caller, not org-mates', async () => {
    const response = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(response.status).toBe(200);
    const bodies = response.body as NotificationBody[];
    expect(bodies.every((n) => n.recipientId === memberUserId)).toBe(true);
    expect(bodies.some((n) => n.title === 'For admin')).toBe(false);
  });

  it('rejects marking another user notification as read', async () => {
    const adminNotification = await prisma.notification.findFirst({
      where: { organizationId: orgId, recipientId: adminUserId },
    });

    const response = await request(app.getHttpServer())
      .patch(`/notifications/${adminNotification!.id}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(response.status).toBe(404);
  });

  it('marks all of the caller notifications as read', async () => {
    const response = await request(app.getHttpServer())
      .patch('/notifications/read-all')
      .set('Authorization', `Bearer ${memberToken}`);
    expect(response.status).toBe(200);

    const unread = await request(app.getHttpServer())
      .get('/notifications?unread=true')
      .set('Authorization', `Bearer ${memberToken}`);
    expect((unread.body as NotificationBody[]).length).toBe(0);
  });
});
