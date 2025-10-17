const LABELS = {
  connecting: 'Connecting',
  live: 'Live',
  reconnecting: 'Reconnecting',
  offline: 'Offline',
};

export default function ConnectionBadge({ status, attempt, error }) {
  const detail =
    status === 'reconnecting' && attempt > 0 ? ` (attempt ${attempt})` : '';
  return (
    <p className={`badge badge--${status}`} role="status">
      <span className="badge__lamp" aria-hidden="true" />
      {LABELS[status]}
      {detail}
      {error && status !== 'live' && <span className="badge__error">{error}</span>}
    </p>
  );
}
