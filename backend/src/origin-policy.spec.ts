import { isOriginAllowed } from './origin-policy';

describe('isOriginAllowed', () => {
  const allowed = ['http://localhost:5173'];

  it('allows clients that send no Origin (non-browser)', () => {
    expect(isOriginAllowed(undefined, 'localhost:3000', allowed)).toBe(true);
  });

  it('allows listed origins', () => {
    expect(
      isOriginAllowed('http://localhost:5173', 'localhost:3000', allowed),
    ).toBe(true);
  });

  it('allows a page served by the same host', () => {
    expect(
      isOriginAllowed('https://stream.example', 'stream.example', allowed),
    ).toBe(true);
  });

  it('rejects other origins and garbage', () => {
    expect(
      isOriginAllowed('https://evil.example', 'localhost:3000', allowed),
    ).toBe(false);
    expect(isOriginAllowed('null', 'localhost:3000', allowed)).toBe(false);
  });
});
