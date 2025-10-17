import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { applySnapshot, mergeReadings } from './readings';

const SOCKET_OPTIONS = {
  transports: ['websocket', 'polling'],
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
};

const defaultConnect = (url, options) => io(url, options);

/**
 * Owns one socket per mounted component. The original code opened the
 * socket at import time and never removed its connect/disconnect handlers,
 * so StrictMode and remounts stacked duplicate listeners.
 */
export function useReadingStream({ url, connect = defaultConnect } = {}) {
  const [stream, setStream] = useState({ streamId: null, readings: [] });
  const [connection, setConnection] = useState({ status: 'connecting', attempt: 0, error: null });
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = connect(url, SOCKET_OPTIONS);
    socketRef.current = socket;

    const onConnect = () => setConnection({ status: 'live', attempt: 0, error: null });
    const onDisconnect = (reason) => {
      // The client does not retry on its own after a server-side disconnect.
      if (reason === 'io server disconnect') socket.connect();
      setConnection((c) => ({ ...c, status: 'reconnecting' }));
    };
    const onConnectError = (err) =>
      setConnection((c) => ({
        ...c,
        status: socket.active ? 'reconnecting' : 'offline',
        error: err?.message || 'Connection failed',
      }));
    const onAttempt = (attempt) => setConnection((c) => ({ ...c, status: 'reconnecting', attempt }));
    const onHistory = (snapshot) => setStream((s) => applySnapshot(s, snapshot));
    const onReading = (reading) =>
      setStream((s) => ({ ...s, readings: mergeReadings(s.readings, [reading]) }));

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('history', onHistory);
    socket.on('processedData', onReading);
    socket.io.on('reconnect_attempt', onAttempt);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('history', onHistory);
      socket.off('processedData', onReading);
      socket.io.off('reconnect_attempt', onAttempt);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [url, connect]);

  const sendReading = useCallback(async (payload) => {
    const socket = socketRef.current;
    if (!socket?.connected) return { status: 'offline' };
    try {
      return await socket.timeout(5000).emitWithAck('newData', payload);
    } catch {
      return { status: 'timeout' };
    }
  }, []);

  return { readings: stream.readings, connection, sendReading };
}
