import { mkdtempSync, writeFileSync } from 'fs';
import type { AddressInfo } from 'net';
import { tmpdir } from 'os';
import { join } from 'path';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { StreamConfig } from '../src/config';
import { configureApp } from '../src/setup';
import type { ProcessedReading } from '../src/stream/reading';
import type { HistorySnapshot } from '../src/stream/reading-stream.service';

const staticDir = mkdtempSync(join(tmpdir(), 'stream-static-'));
writeFileSync(
  join(staticDir, 'index.html'),
  '<!doctype html><title>spa</title>',
);

const baseConfig: StreamConfig = {
  port: 0,
  corsOrigins: ['http://allowed.test'],
  historySize: 3,
  rateLimit: { max: 5, windowMs: 60_000 },
  simulatorIntervalMs: 0,
  staticDir,
};

describe('reading stream (e2e)', () => {
  let app: NestExpressApplication;
  let url: string;
  const sockets: Socket[] = [];

  async function start(overrides: Partial<StreamConfig> = {}) {
    const config = { ...baseConfig, ...overrides };
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule.forConfig(config)],
    }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({
      logger: false,
    });
    configureApp(app, config);
    await app.listen(0, '127.0.0.1');
    const { port } = app.getHttpServer().address() as AddressInfo;
    url = `http://127.0.0.1:${port}`;
  }

  function connect(extraHeaders?: Record<string, string>): Socket {
    const socket = io(url, {
      transports: ['websocket'],
      reconnection: false,
      forceNew: true,
      extraHeaders,
    });
    sockets.push(socket);
    return socket;
  }

  /** Connects and resolves with the history snapshot sent on connection. */
  function connectWithHistory(): Promise<{
    socket: Socket;
    history: ProcessedReading[];
    streamId: string;
  }> {
    const socket = connect();
    return new Promise((resolve, reject) => {
      socket.once('history', (snapshot: HistorySnapshot) =>
        resolve({
          socket,
          history: snapshot.readings,
          streamId: snapshot.streamId,
        }),
      );
      socket.once('connect_error', reject);
    });
  }

  const send = (socket: Socket, payload: unknown) =>
    socket.timeout(2000).emitWithAck('newData', payload) as Promise<
      Record<string, unknown>
    >;

  afterEach(async () => {
    sockets.splice(0).forEach((s) => s.disconnect());
    await app.close();
  });

  it('broadcasts accepted readings to every client with only whitelisted fields', async () => {
    await start();
    const { socket: sender } = await connectWithHistory();
    const { socket: watcher } = await connectWithHistory();
    const received = new Promise<ProcessedReading>((resolve) =>
      watcher.once('processedData', resolve),
    );

    const ack = await send(sender, { value: 91, source: 'bench', admin: true });

    expect(ack).toEqual({ status: 'accepted', id: 1 });
    const reading = await received;
    expect(reading).toEqual({
      id: 1,
      value: 91,
      source: 'bench',
      severity: 'high',
      processedAt: expect.any(String) as string,
    });
  });

  it('acks invalid and filtered readings without broadcasting them', async () => {
    await start();
    const { socket } = await connectWithHistory();
    const broadcasts: unknown[] = [];
    socket.on('processedData', (r) => broadcasts.push(r));

    expect(await send(socket, { value: 'high' })).toEqual({
      status: 'invalid',
      error: 'value must be a finite number',
    });
    expect(await send(socket, null)).toMatchObject({ status: 'invalid' });
    expect(await send(socket, { value: 20 })).toEqual({ status: 'filtered' });
    expect(broadcasts).toEqual([]);
  });

  it('rate limits a client and keeps the budget across reconnects', async () => {
    await start({ rateLimit: { max: 2, windowMs: 60_000 } });
    const first = (await connectWithHistory()).socket;
    expect(await send(first, { value: 60 })).toMatchObject({
      status: 'accepted',
    });
    expect(await send(first, { value: 61 })).toMatchObject({
      status: 'accepted',
    });
    first.disconnect();

    const second = (await connectWithHistory()).socket;
    const ack = await send(second, { value: 62 });
    expect(ack.status).toBe('rate_limited');
    expect(ack.retryAfterMs).toBeGreaterThan(0);
  });

  it('replays a bounded history to clients that reconnect', async () => {
    await start();
    const { socket, streamId } = await connectWithHistory();
    for (const value of [60, 70, 80, 90]) {
      await send(socket, { value });
    }
    socket.disconnect();

    const { history } = await connectWithHistory();
    expect(history.map((r) => r.value)).toEqual([70, 80, 90]);
    expect(history.map((r) => r.id)).toEqual([2, 3, 4]);
    expect((await connectWithHistory()).streamId).toBe(streamId);
  });

  it('uses a new stream id after a restart so clients can drop stale ids', async () => {
    await start();
    const before = (await connectWithHistory()).streamId;
    sockets.splice(0).forEach((s) => s.disconnect());
    await app.close();
    await start();
    const after = await connectWithHistory();
    expect(after.streamId).not.toBe(before);
    expect(after.history).toEqual([]);
  });

  describe('origin checks', () => {
    const outcome = (socket: Socket) =>
      new Promise<string>((resolve) => {
        socket.once('connect', () => resolve('connected'));
        socket.once('connect_error', () => resolve('rejected'));
      });

    it('rejects a socket from an unlisted browser origin', async () => {
      await start();
      expect(await outcome(connect({ origin: 'https://evil.example' }))).toBe(
        'rejected',
      );
    });

    it('accepts listed and same-host origins', async () => {
      await start();
      expect(await outcome(connect({ origin: 'http://allowed.test' }))).toBe(
        'connected',
      );
      expect(await outcome(connect({ origin: url }))).toBe('connected');
    });

    it('does not send CORS headers to unlisted origins over HTTP', async () => {
      await start();
      const evil = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'https://evil.example');
      expect(evil.headers['access-control-allow-origin']).toBeUndefined();

      const allowed = await request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'http://allowed.test');
      expect(allowed.headers['access-control-allow-origin']).toBe(
        'http://allowed.test',
      );
    });
  });

  describe('HTTP', () => {
    it('serves health and the buffered readings', async () => {
      await start();
      const { socket } = await connectWithHistory();
      await send(socket, { value: 75, source: 'probe' });

      await request(app.getHttpServer())
        .get('/api/health')
        .expect(200, { status: 'ok' });
      const res = await request(app.getHttpServer())
        .get('/api/readings')
        .expect(200);
      expect(res.body).toMatchObject([
        { id: 1, value: 75, source: 'probe', severity: 'normal' },
      ]);
    });

    it('falls back to index.html for client-side routes but not for unknown API paths', async () => {
      await start();
      const page = await request(app.getHttpServer())
        .get('/some/view')
        .expect(200);
      expect(page.text).toContain('<title>spa</title>');
      await request(app.getHttpServer()).get('/api/nope').expect(404);
    });
  });
});
