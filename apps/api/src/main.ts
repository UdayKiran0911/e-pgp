import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // SDK (Phase 8 Module 9), scoped: publishes the OpenAPI spec (also
  // satisfies Phase 4's "OpenAPI Specification" deliverable) at
  // /api-docs-json, with a browsable UI at /api-docs. A generated typed
  // client package (`@epg/sdk`) is a separate codegen-pipeline decision,
  // deliberately not built here — this spec is what any such generator
  // would consume.
  const openApiConfig = new DocumentBuilder()
    .setTitle('EPG Platform API')
    .setDescription('Enterprise Project Governance Platform — REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  SwaggerModule.setup('api-docs', app, openApiDocument);

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
