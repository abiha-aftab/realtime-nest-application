import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';
import { allowRequestFor } from './origin-policy';

export class ConfiguredIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly corsOrigins: string[],
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.corsOrigins },
      allowRequest: allowRequestFor(this.corsOrigins),
      maxHttpBufferSize: 16 * 1024,
    } as ServerOptions);
  }
}
