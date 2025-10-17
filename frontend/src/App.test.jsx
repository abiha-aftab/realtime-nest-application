import { render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from './App';

vi.mock('socket.io-client', () => ({
  io: () => ({ on: vi.fn(), off: vi.fn() }),
}));

test('renders the dashboard heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /real-time dashboard/i })).toBeInTheDocument();
});
