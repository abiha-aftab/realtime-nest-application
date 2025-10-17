import type { IncomingMessage } from 'http';

/**
 * Browsers do not apply CORS to WebSocket upgrades, so the socket.io `cors`
 * option alone does not stop another site from opening a socket. This check
 * runs on every handshake (polling and websocket) and only lets through
 * same-host pages, explicitly allowed origins, and non-browser clients that
 * send no Origin header.
 */
export function isOriginAllowed(
  origin: string | undefined,
  host: string | undefined,
  allowed: readonly string[],
): boolean {
  if (!origin) return true;
  if (allowed.includes(origin)) return true;
  try {
    return host !== undefined && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function allowRequestFor(allowed: readonly string[]) {
  return (
    req: IncomingMessage,
    callback: (err: string | null, ok: boolean) => void,
  ) => {
    const ok = isOriginAllowed(req.headers.origin, req.headers.host, allowed);
    callback(ok ? null : 'origin not allowed', ok);
  };
}
