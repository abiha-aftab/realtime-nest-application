import { useState } from 'react';

const MESSAGES = {
  accepted: (ack) => `Accepted as #${ack.id}.`,
  filtered: () => 'Received, but values of 50 or less are filtered out.',
  invalid: (ack) => `Rejected: ${ack.error}.`,
  rate_limited: (ack) => `Slow down: try again in ${Math.ceil(ack.retryAfterMs / 1000)} s.`,
  offline: () => 'Not connected; the reading was not sent.',
  timeout: () => 'The server did not answer in time.',
};

export default function SendReadingForm({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const [source, setSource] = useState('');
  const [result, setResult] = useState(null);
  const [sending, setSending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    const payload = { value: Number(value) };
    if (source.trim()) payload.source = source.trim();
    const ack = await onSend(payload);
    setSending(false);
    setResult(ack);
  }

  const message = result && (MESSAGES[result.status]?.(result) ?? 'Unexpected reply.');
  const tone = result?.status === 'accepted' ? 'ok' : result?.status === 'filtered' ? 'muted' : 'warn';

  return (
    <form className="send" onSubmit={submit}>
      <h2>Inject a reading</h2>
      <div className="send__fields">
        <label>
          Value
          <input
            type="number"
            inputMode="decimal"
            min="0"
            max="100"
            step="any"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <label>
          Source
          <input
            type="text"
            maxLength={40}
            placeholder="client"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>
      </div>
      <button type="submit" disabled={disabled || sending}>
        {sending ? 'Sending…' : 'Send'}
      </button>
      <p className={`send__result send__result--${tone}`} aria-live="polite">
        {message}
      </p>
    </form>
  );
}
