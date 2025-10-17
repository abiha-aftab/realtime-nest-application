import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Unset means same origin: the Nest server in production, the Vite proxy in dev.
const socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
  transports: ['websocket', 'polling'],
});

export default function LiveData() {
  const [items, setItems] = useState([]);

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
