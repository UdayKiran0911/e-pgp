import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

/**
 * Integration test: exercises the real Prisma connection against a live
 * Postgres instance (see docker-compose.yml -> `postgres` service).
 * Run `docker compose up -d postgres` before `pnpm test:integration`.
 */
describe('Health (integration)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health reports the database as up', async () => {
    const response = await request(app.getHttpServer()).get('/health');
    const body = response.body as {
      info: Record<string, { status: string }>;
    };

    expect(response.status).toBe(200);
    expect(body.info.database.status).toBe('up');
  });
});
