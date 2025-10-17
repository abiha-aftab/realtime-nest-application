const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export default function ReadingLog({ readings, status }) {
  if (readings.length === 0) {
    const waiting = status === 'connecting' || status === 'reconnecting';
    return (
      <p className="log__empty">
        {waiting
          ? 'Connecting to the stream…'
          : status === 'offline'
            ? 'The stream is offline. Readings will appear once the server is reachable.'
            : 'Waiting for the first reading above 50.'}
      </p>
    );
  }
  return (
    <div className="log__scroll" tabIndex={0} aria-label="Reading log">
      <table className="log">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Time</th>
            <th scope="col" className="num">Value</th>
            <th scope="col">Source</th>
            <th scope="col">Severity</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => (
            <tr key={r.id} className={`log__row--${r.severity}`}>
              <td>{r.id}</td>
              <td>
                <time dateTime={r.processedAt}>{timeFormat.format(new Date(r.processedAt))}</time>
              </td>
              <td className="num">{r.value}</td>
              <td>{r.source}</td>
              <td>
                <span className={`sev sev--${r.severity}`}>{r.severity}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
