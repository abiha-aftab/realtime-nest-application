import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { createFakeSocket } from './test/fakeSocket';

const reading = (id, value, severity = value > 80 ? 'high' : 'normal') => ({
  id,
  value,
  severity,
  source: 'simulator',
  processedAt: '2026-11-10T12:00:00.000Z',
});

let socket;
const connect = () => socket;

function renderApp() {
  return render(<App connect={connect} />);
}

const rows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);
const status = () => screen.getByRole('status');

beforeEach(() => {
  socket = createFakeSocket();
});

describe('connection lifecycle', () => {
  it('shows a loading state, then the replayed history once live', () => {
    renderApp();
    expect(status()).toHaveTextContent('Connecting');
    expect(screen.getByText(/connecting to the stream/i)).toBeInTheDocument();

    act(() => {
      socket.serverConnect();
      socket.fire('history', { streamId: 'a', readings: [reading(1, 60), reading(2, 90)] });
    });

    expect(status()).toHaveTextContent('Live');
    expect(rows()).toHaveLength(2);
    expect(rows()[0]).toHaveTextContent('90');
  });

  it('shows an empty state when live with no readings', () => {
    renderApp();
    act(() => {
      socket.serverConnect();
      socket.fire('history', { streamId: 'a', readings: [] });
    });
    expect(screen.getByText(/waiting for the first reading/i)).toBeInTheDocument();
  });

  it('dedupes the replay sent after a reconnect', () => {
    renderApp();
    act(() => {
      socket.serverConnect();
      socket.fire('history', { streamId: 'a', readings: [reading(1, 60)] });
      socket.fire('processedData', reading(2, 70));
      socket.serverDisconnect();
      socket.fireManager('reconnect_attempt', 2);
    });
    expect(status()).toHaveTextContent('Reconnecting (attempt 2)');

    act(() => {
      socket.serverConnect();
      socket.fire('history', {
        streamId: 'a',
        readings: [reading(1, 60), reading(2, 70), reading(3, 88)],
      });
    });
    expect(rows().map((row) => row.cells[0].textContent)).toEqual(['3', '2', '1']);
  });

  it('replaces stale readings when the server restarted', () => {
    renderApp();
    act(() => {
      socket.serverConnect();
      socket.fire('history', { streamId: 'a', readings: [reading(7, 60), reading(8, 61)] });
      socket.serverDisconnect();
      socket.serverConnect();
      socket.fire('history', { streamId: 'b', readings: [reading(1, 99)] });
    });
    expect(rows()).toHaveLength(1);
    expect(rows()[0]).toHaveTextContent('99');
  });

  it('asks to reconnect after a server-side disconnect', () => {
    renderApp();
    act(() => {
      socket.serverConnect();
      socket.serverDisconnect('io server disconnect');
    });
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('reports a connection error and offline state', () => {
    renderApp();
    act(() => {
      socket.active = false;
      socket.fire('connect_error', new Error('origin not allowed'));
    });
    expect(status()).toHaveTextContent('Offline');
    expect(status()).toHaveTextContent('origin not allowed');
    expect(screen.getByText(/stream is offline/i)).toBeInTheDocument();
  });

  it('removes its listeners and closes the socket on unmount', () => {
    const { unmount } = renderApp();
    expect(socket.listenerCount('processedData')).toBe(1);
    unmount();
    expect(socket.listenerCount('processedData')).toBe(0);
    expect(socket.listenerCount('connect')).toBe(0);
    expect(socket.disconnect).toHaveBeenCalled();
  });
});

describe('injecting a reading', () => {
  async function submit(value, source) {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Value'), value);
    if (source) await user.type(screen.getByLabelText('Source'), source);
    await user.click(screen.getByRole('button', { name: 'Send' }));
  }

  beforeEach(() => {
    renderApp();
    act(() => socket.serverConnect());
  });

  it('sends the payload and shows the ack', async () => {
    await submit('92', 'bench');
    expect(socket.emitWithAck).toHaveBeenCalledWith('newData', { value: 92, source: 'bench' });
    expect(await screen.findByText('Accepted as #1.')).toBeInTheDocument();
  });

  it.each([
    [{ status: 'filtered' }, /filtered out/],
    [{ status: 'invalid', error: 'value must be between 0 and 100' }, /Rejected: value must be/],
    [{ status: 'rate_limited', retryAfterMs: 4200 }, /try again in 5 s/],
  ])('explains %j', async (ack, text) => {
    socket.ack = ack;
    await submit('40');
    expect(await screen.findByText(text)).toBeInTheDocument();
  });

  it('disables sending while not live', () => {
    act(() => socket.serverDisconnect());
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });
});
