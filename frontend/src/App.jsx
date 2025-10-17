import ConnectionBadge from './components/ConnectionBadge';
import ReadingLog from './components/ReadingLog';
import SendReadingForm from './components/SendReadingForm';
import StripChart from './components/StripChart';
import { summarize } from './readings';
import { useReadingStream } from './useReadingStream';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

export default function App({ connect }) {
  const { readings, connection, sendReading } = useReadingStream({ url: SOCKET_URL, connect });
  const { latest, high, peak } = summarize(readings);

  return (
    <div className="shell">
      <header className="masthead">
        <div>
          <p className="masthead__kicker">Socket.IO · NestJS</p>
          <h1>Live readings</h1>
          <p className="masthead__note">
            Values above 50 pass the filter; above 80 they are flagged high.
          </p>
        </div>
        <ConnectionBadge {...connection} />
      </header>

      <main className="layout">
        <section className="panel panel--trace" aria-labelledby="trace-title">
          <div className="panel__head">
            <h2 id="trace-title">Trace</h2>
            <dl className="readout">
              <div>
                <dt>Latest</dt>
                <dd className={latest ? `readout--${latest.severity}` : undefined}>
                  {latest ? latest.value : '—'}
                </dd>
              </div>
              <div>
                <dt>Peak</dt>
                <dd>{peak ?? '—'}</dd>
              </div>
              <div>
                <dt>High</dt>
                <dd>{high}</dd>
              </div>
              <div>
                <dt>Kept</dt>
                <dd>{readings.length}</dd>
              </div>
            </dl>
          </div>
          <StripChart readings={readings} />
        </section>

        <aside className="panel panel--send">
          <SendReadingForm onSend={sendReading} disabled={connection.status !== 'live'} />
        </aside>

        <section className="panel panel--log" aria-labelledby="log-title">
          <h2 id="log-title">Log</h2>
          <ReadingLog readings={readings} status={connection.status} />
        </section>
      </main>
    </div>
  );
}
