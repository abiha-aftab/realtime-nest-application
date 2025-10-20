import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';
const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

export default function LiveData() {
  const [items, setItems] = useState([]);
  const latestRef = useRef(null);
  latestRef.current = items;

  useEffect(() => {
    socket.on('connect', () => console.log('connected to socket', socket.id));
    socket.on('processedData', (data) => {
      if (!data) return;
      setItems(prev => {
        const next = [data, ...prev].slice(0, 1000); // keep last 1000
        return next;
      });
    });
    socket.on('disconnect', () => console.log('socket disconnected'));

    return () => {
      socket.off('processedData');
    };
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Live Data</h2>
      <div style={{ maxHeight: '60vh', overflow: 'auto', border: '1px solid #ddd', padding: 10 }}>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
              <strong>{it.value}</strong> — {it.severity} — <small>{it.processedAt}</small>
              <div><code>{JSON.stringify(it)}</code></div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
