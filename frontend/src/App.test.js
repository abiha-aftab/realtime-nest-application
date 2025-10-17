import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('socket.io-client', () => ({
  io: () => ({ on: jest.fn(), off: jest.fn() }),
}));

test('renders the dashboard heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /real-time dashboard/i })).toBeInTheDocument();
});
