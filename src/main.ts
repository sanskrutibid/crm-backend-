import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false, // Turn off verbose system logs to highlight custom startup logs
    }),
  );

  // Security headers & compression
  await app.register(helmet);
  await app.register(compress);

  // Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Global Prefix
  app.setGlobalPrefix('api');

  // API Versioning (e.g. /api/v1/leads)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Pipes: strict white-listing & automatic type transformation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Interceptors & Exception Filters
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new TransformInterceptor(reflector));
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('CRM Premium REST API')
    .setDescription(
      'Industry-standard CRM backend services developed & maintained by Phian Infotech, equipped with high-speed performance under Fastify.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter valid JWT access token',
        in: 'header',
      },
      'bearer', // auth name matching standard @ApiBearerAuth()
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, '0.0.0.0');

  const bannerColor = '\x1b[36m'; // Cyan
  const successColor = '\x1b[32m'; // Green
  const infoColor = '\x1b[35m'; // Magenta
  const resetColor = '\x1b[0m'; // Reset

  console.log(`
${bannerColor}==================================================================
   🚀  CRM APP PREMIUM BACKEND SERVER INITIATED SUCCESSFULY
==================================================================${resetColor}
🌐  ${successColor}Server URL${resetColor}      :  http://localhost:${PORT}
📚  ${successColor}Swagger API docs${resetColor}:  http://localhost:${PORT}/docs
🛢️   ${successColor}Database Status${resetColor} :  MongoDB Connection Established Successfully
⚡  ${successColor}Framework Engine${resetColor}:  NestJS v11 + Fastify (High-Performance Engine)
🌍  ${infoColor}Environment Mode${resetColor}:  ${process.env.NODE_ENV?.toUpperCase() || 'DEVELOPMENT'}
==================================================================
  `);
}

bootstrap();