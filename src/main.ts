import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { join } from 'path';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

console.time('Nest Startup');

async function bootstrap() {

  console.time('NestFactory.create');
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      bodyLimit: 52428800, // 50MB for photo & video uploads
    }),
  );

  console.timeEnd('NestFactory.create');

  // Security headers & compression
  await app.register(helmet, {
    crossOriginResourcePolicy: false, // allow loading static uploads cross-origin
  });
  await app.register(compress);

  // Serve static files from uploads directory
  await app.register(fastifyStatic, {
    root: join(process.cwd(), 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });

  // Enable CORS for frontend API calls (essential for localhost port cross-talk)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

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
      forbidNonWhitelisted: false,
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

  console.time('Swagger');

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  console.timeEnd('Swagger');

  console.time('Listen');
  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, '0.0.0.0');
  console.timeEnd('Listen');

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

  console.timeEnd('Nest Startup');

}

bootstrap();
