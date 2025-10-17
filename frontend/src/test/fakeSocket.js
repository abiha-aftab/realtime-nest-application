import { vi } from 'vitest';

function emitter() {
  const handlers = new Map();
  return {
    on(event, fn) {
      handlers.set(event, [...(handlers.get(event) ?? []), fn]);
    },
    off(event, fn) {
      handlers.set(event, (handlers.get(event) ?? []).filter((h) => h !== fn));
    },
    fire(event, ...args) {
      (handlers.get(event) ?? []).forEach((fn) => fn(...args));
    },
    count(event) {
      return (handlers.get(event) ?? []).length;
    },
  };
}

/** Minimal stand-in for a socket.io-client Socket, driven by the test. */
export function createFakeSocket() {
  const events = emitter();
  const manager = emitter();
  const socket = {
    connected: false,
    active: true,
    io: { on: manager.on, off: manager.off },
    on: events.on,
    off: events.off,
    connect: vi.fn(),
    disconnect: vi.fn(() => {
      socket.connected = false;
      socket.active = false;
    }),
    ack: { status: 'accepted', id: 1 },
    emitWithAck: vi.fn(async () => socket.ack),
    timeout: () => socket,
    serverConnect() {
      socket.connected = true;
      events.fire('connect');
    },
    serverDisconnect(reason = 'transport close') {
      socket.connected = false;
      events.fire('disconnect', reason);
    },
    fire: events.fire,
    fireManager: manager.fire,
    listenerCount: (event) => events.count(event),
  };
  return socket;
}
