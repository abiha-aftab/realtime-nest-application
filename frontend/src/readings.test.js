import { describe, expect, it } from 'vitest';
import { applySnapshot, mergeReadings, summarize } from './readings';

const r = (id, value = 60, severity = 'normal') => ({ id, value, severity, source: 's' });

describe('mergeReadings', () => {
  it('dedupes by id and keeps newest first', () => {
    const merged = mergeReadings([r(3), r(2)], [r(2), r(4), r(1)]);
    expect(merged.map((x) => x.id)).toEqual([4, 3, 2, 1]);
  });

  it('caps the list at the limit', () => {
    const merged = mergeReadings([], [r(1), r(2), r(3), r(4)], 2);
    expect(merged.map((x) => x.id)).toEqual([4, 3]);
  });
});

describe('applySnapshot', () => {
  it('merges a replay from the same stream', () => {
    const state = { streamId: 'a', readings: [r(5), r(4)] };
    const next = applySnapshot(state, { streamId: 'a', readings: [r(4), r(5), r(6)] });
    expect(next.readings.map((x) => x.id)).toEqual([6, 5, 4]);
  });

  it('drops old readings when the server restarted', () => {
    const state = { streamId: 'a', readings: [r(9), r(8)] };
    const next = applySnapshot(state, { streamId: 'b', readings: [r(1)] });
    expect(next).toEqual({ streamId: 'b', readings: [r(1)] });
  });
});

describe('summarize', () => {
  it('reports latest, peak and high count', () => {
    expect(summarize([r(3, 70), r(2, 95, 'high'), r(1, 85, 'high')])).toEqual({
      latest: r(3, 70),
      peak: 95,
      high: 2,
    });
  });

  it('handles an empty list', () => {
    expect(summarize([])).toEqual({ latest: null, high: 0, peak: null });
  });
});
