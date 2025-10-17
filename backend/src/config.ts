import { join } from 'path';

export interface StreamConfig {
  port: number;
  /** Browser origins allowed to open a socket or call the HTTP API cross-origin. */
  corsOrigins: string[];
  historySize: number;
  rateLimit: { max: number; windowMs: number };
  /** 0 disables the built-in simulator. */
  simulatorIntervalMs: number;
  staticDir: string;
}

export const STREAM_CONFIG = Symbol('STREAM_CONFIG');

function intFromEnv(
  raw: string | undefined,
  fallback: number,
  min: number,
): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min) {
    throw new Error(`Expected an integer >= ${min}, got "${raw}"`);
  }
  return parsed;
}

export function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  const origins = raw
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (origins.includes('*')) {
    throw new Error(
      'CORS_ORIGINS must list explicit origins; "*" would let any site read the stream',
    );
  }
  return origins;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): StreamConfig {
  return {
    port: intFromEnv(env.PORT, 3000, 0),
    corsOrigins: parseOrigins(env.CORS_ORIGINS),
    historySize: intFromEnv(env.HISTORY_SIZE, 100, 1),
    rateLimit: {
      max: intFromEnv(env.RATE_LIMIT_MAX, 10, 1),
      windowMs: intFromEnv(env.RATE_LIMIT_WINDOW_MS, 10_000, 100),
    },
    simulatorIntervalMs: intFromEnv(env.SIMULATOR_INTERVAL_MS, 2000, 0),
    staticDir: env.STATIC_DIR || join(__dirname, '..', 'public'),
  };
}
