import { describe, expect, it } from 'vitest';
import { EventHistory } from './event-history';

describe('EventHistory', () => {
  it('keeps only the newest items up to capacity', () => {
    const history = new EventHistory<number>(3);
    [1, 2, 3, 4, 5].forEach((n) => history.push(n));
    expect(history.snapshot()).toEqual([3, 4, 5]);
    expect(history.size).toBe(3);
  });

  it('returns a copy', () => {
    const history = new EventHistory<number>(2);
    history.push(1);
    history.snapshot().push(99);
    expect(history.snapshot()).toEqual([1]);
  });

  it('rejects a non-positive capacity', () => {
    expect(() => new EventHistory(0)).toThrow('capacity');
  });
});
