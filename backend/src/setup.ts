import { existsSync } from 'fs';
import { join } from 'path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import type { StreamConfig } from './config';
import { ConfiguredIoAdapter } from './configured-io.adapter';
import { isOriginAllowed } from './origin-policy';

/** Shared by main.ts and the e2e tests so both run the same HTTP/socket setup. */
export function configureApp(
  app: NestExpressApplication,
  config: StreamConfig,
): void {
  app.useWebSocketAdapter(new ConfiguredIoAdapter(app, config.corsOrigins));
  app.enableCors({
    origin: (origin, callback) =>
      callback(null, isOriginAllowed(origin, undefined, config.corsOrigins)),
  });
  app.enableShutdownHooks();

  const indexHtml = join(config.staticDir, 'index.html');
  if (!existsSync(indexHtml)) return;

  app.useStaticAssets(config.staticDir);
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isApi =
      req.path.startsWith('/api/') || req.path.startsWith('/socket.io');
    if (req.method !== 'GET' || isApi) return next();
    res.sendFile(indexHtml);
  });
}
