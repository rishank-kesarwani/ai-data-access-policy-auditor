import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';
  const corsOrigin = configService.get<string>('corsOrigin') || '*';
  const publicAccess = configService.get<boolean>('publicAccessEnable') ?? false;

  // Security headers & compression
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix (excluding /health for Render health checks)
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global exception filter with sensitive field redaction
  app.useGlobalFilters(new HttpExceptionFilter());

  // Graceful shutdown hooks
  app.enableShutdownHooks();

  // Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Data Access & Policy Auditor API')
    .setDescription(
      'Auditable policy evaluation for AI workflow data access, explicit authorization rules, explainable allow/deny/escalate decisions, and cryptographic tamper-evident access records.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-service-api-key', in: 'header' }, 'x-service-api-key')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Bind to 0.0.0.0 and process.env.PORT
  await app.listen(port, '0.0.0.0');

  logger.log(`========================================================`);
  logger.log(` AI Data Access & Policy Auditor Backend is Running!`);
  logger.log(` Port: ${port} | Host: 0.0.0.0`);
  logger.log(` API Prefix: /${apiPrefix}`);
  logger.log(` Swagger Docs: http://localhost:${port}/api/docs`);
  logger.log(` Health Check: http://localhost:${port}/health`);
  logger.log(` PUBLIC_ACCESS_ENABLE: ${publicAccess}`);
  logger.log(`========================================================`);
}

bootstrap();
