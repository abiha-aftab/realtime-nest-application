import { Inject, type OnModuleDestroy } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { STREAM_CONFIG, type StreamConfig } from '../config';
import { RateLimiter } from './rate-limiter';
import { validateReading } from './reading';
import { ReadingStreamService } from './reading-stream.service';

export type ReadingAck =
  | { status: 'accepted'; id: number }
  | { status: 'filtered' }
  | { status: 'invalid'; error: string }
  | { status: 'rate_limited'; retryAfterMs: number };

@WebSocketGateway()
export class ReadingGateway
  implements OnGatewayInit, OnGatewayConnection, OnModuleDestroy
{
  @WebSocketServer() server!: Server;

  private readonly limiter: RateLimiter;
  private simulator?: NodeJS.Timeout;

  constructor(
    @Inject(STREAM_CONFIG) private readonly config: StreamConfig,
    private readonly stream: ReadingStreamService,
  ) {
    this.limiter = new RateLimiter(
      config.rateLimit.max,
      config.rateLimit.windowMs,
    );
  }

  afterInit(): void {
    if (this.config.simulatorIntervalMs > 0) {
      this.simulator = setInterval(
        () => this.simulateReading(),
        this.config.simulatorIntervalMs,
      );
      this.simulator.unref();
    }
  }

  onModuleDestroy(): void {
    clearInterval(this.simulator);
  }

  /** Every (re)connecting client gets the buffered history so it can fill gaps. */
  handleConnection(client: Socket): void {
    client.emit('history', this.stream.snapshot());
  }

  @SubscribeMessage('newData')
  handleNewData(client: Socket, payload: unknown): ReadingAck {
    const decision = this.limiter.check(client.handshake.address);
    if (!decision.allowed) {
      return { status: 'rate_limited', retryAfterMs: decision.retryAfterMs };
    }
    const result = validateReading(payload);
    if (!result.ok) return { status: 'invalid', error: result.error };
    const processed = this.stream.ingest(result.reading);
    if (!processed) return { status: 'filtered' };
    this.server.emit('processedData', processed);
    return { status: 'accepted', id: processed.id };
  }

  private simulateReading(): void {
    const value = Math.floor(Math.random() * 101);
    const processed = this.stream.ingest({ value, source: 'simulator' });
    if (processed) this.server.emit('processedData', processed);
  }
}
