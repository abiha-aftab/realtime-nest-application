import { passesFilter, severityOf, validateReading } from './reading';

describe('validateReading', () => {
  it.each([
    [null, 'payload must be an object'],
    ['42', 'payload must be an object'],
    [[42], 'payload must be an object'],
    [{}, 'value must be a finite number'],
    [{ value: '70' }, 'value must be a finite number'],
    [{ value: Number.NaN }, 'value must be a finite number'],
    [{ value: 101 }, 'value must be between 0 and 100'],
    [{ value: -1 }, 'value must be between 0 and 100'],
    [{ value: 60, source: 42 }, /^source must be/],
    [{ value: 60, source: '' }, /^source must be/],
    [{ value: 60, source: '<script>' }, /^source must be/],
    [{ value: 60, source: 'x'.repeat(41) }, /^source must be/],
  ])('rejects %j', (payload, error) => {
    const result = validateReading(payload);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(error);
  });

  it('keeps only value and source', () => {
    expect(
      validateReading({
        value: 72,
        source: ' bench-3 ',
        severity: 'low',
        admin: true,
      }),
    ).toEqual({ ok: true, reading: { value: 72, source: 'bench-3' } });
  });

  it('defaults the source', () => {
    expect(validateReading({ value: 0 })).toEqual({
      ok: true,
      reading: { value: 0, source: 'client' },
    });
  });
});

describe('filter and severity', () => {
  it('drops readings at or below 50', () => {
    expect(passesFilter({ value: 50, source: 's' })).toBe(false);
    expect(passesFilter({ value: 50.5, source: 's' })).toBe(true);
  });

  it('marks readings above 80 as high', () => {
    expect(severityOf(80)).toBe('normal');
    expect(severityOf(81)).toBe('high');
  });
});
