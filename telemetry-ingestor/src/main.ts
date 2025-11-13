import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import * as express from 'express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log','error','warn'] });
  const config = app.get(ConfigService);
  const port = config.get('PORT') || 3000;

  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  await app.listen(port);
  Logger.log(JSON.stringify({ event: 'app_started', port }), 'Bootstrap');
}
bootstrap();
