// SDK (Phase 8 Module 9) codegen input: boots the Nest app context (no HTTP
// listener) just far enough to build the same Swagger document `main.ts`
// serves at /api-docs-json, then writes it to packages/sdk/openapi.json —
// the source `openapi-typescript` reads to generate @epg/sdk's types. Run
// via `pnpm --filter api export:openapi` whenever a route/DTO changes and
// the SDK needs regenerating; not wired into CI (needs a real DB
// connection for module init, same as any other app boot).
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });

  const openApiConfig = new DocumentBuilder()
    .setTitle('EPG Platform API')
    .setDescription('Enterprise Project Governance Platform — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);

  const outputPath = join(__dirname, '..', '..', '..', 'packages', 'sdk', 'openapi.json');
  writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2));
  console.log(`Wrote OpenAPI spec to ${outputPath}`);

  await app.close();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
