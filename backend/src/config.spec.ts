import { describe, expect, it } from 'vitest';
import { loadConfig, parseOrigins } from './config';

describe('parseOrigins', () => {
  it('splits, trims and strips trailing slashes', () => {
    expect(parseOrigins(' http://a.test/ ,https://b.test ,')).toEqual([
      'http://a.test',
      'https://b.test',
    ]);
  });

  it('refuses a wildcard', () => {
    expect(() => parseOrigins('http://a.test,*')).toThrow('explicit origins');
  });

  it('treats an unset value as no extra origins', () => {
    expect(parseOrigins(undefined)).toEqual([]);
  });
});

describe('loadConfig', () => {
  it('uses defaults', () => {
    const config = loadConfig({});
    expect(config).toMatchObject({
      port: 3000,
      corsOrigins: [],
      historySize: 100,
      rateLimit: { max: 10, windowMs: 10_000 },
      simulatorIntervalMs: 2000,
    });
  });

  it('rejects malformed numbers', () => {
    expect(() => loadConfig({ HISTORY_SIZE: '0' })).toThrow('>= 1');
    expect(() => loadConfig({ RATE_LIMIT_MAX: 'ten' })).toThrow('integer');
  });
});
