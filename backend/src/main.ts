import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { loadConfig } from './config';
import { configureApp } from './setup';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.forConfig(config),
  );
  configureApp(app, config);
  await app.listen(config.port);
  Logger.log(`Listening on http://localhost:${config.port}`, 'Bootstrap');
}

void bootstrap();
