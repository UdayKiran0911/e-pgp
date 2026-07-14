import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AuthResponseBody, PublicUserBody } from './test-types';

/**
 * Integration test: exercises registration/login/me against a real Postgres
 * instance (see docker-compose.yml -> `postgres` service).
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Auth (integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const email = `auth-integration-${Date.now()}@acme.test`;
  const password = 'super-secret-1';

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
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.organization.deleteMany({
      where: { name: 'Auth Integration Org' },
    });
    await app.close();
  });

  it('registers a new organization + admin user and returns a usable token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: 'Auth Integration Org',
        name: 'Test Admin',
        email,
        password,
      });
    const body = response.body as AuthResponseBody;

    expect(response.status).toBe(201);
    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user.email).toBe(email);
    expect(body.user.role).toBe('ADMIN');
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('rejects registering the same email twice', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        organizationName: 'Auth Integration Org 2',
        name: 'Test Admin',
        email,
        password,
      });

    expect(response.status).toBe(409);
  });

  it('logs in with correct credentials and rejects incorrect ones', async () => {
    const goodLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    const goodBody = goodLogin.body as AuthResponseBody;
    expect(goodLogin.status).toBe(200);
    expect(goodBody.accessToken).toEqual(expect.any(String));

    const badLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' });
    expect(badLogin.status).toBe(401);
  });

  it('returns the current user profile for a valid token and 401s without one', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    const { accessToken: token } = login.body as AuthResponseBody;

    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    const meBody = me.body as PublicUserBody;
    expect(me.status).toBe(200);
    expect(meBody.email).toBe(email);

    const unauthenticated = await request(app.getHttpServer()).get('/auth/me');
    expect(unauthenticated.status).toBe(401);
  });
});
