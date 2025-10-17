export const FILTER_THRESHOLD = 50;
export const HIGH_THRESHOLD = 80;
export const VALUE_MIN = 0;
export const VALUE_MAX = 100;
const SOURCE_PATTERN = /^[\w .-]{1,40}$/;

export interface ReadingInput {
  value: number;
  source: string;
}

export interface ProcessedReading extends ReadingInput {
  id: number;
  severity: 'normal' | 'high';
  processedAt: string;
}

export type ValidationResult =
  | { ok: true; reading: ReadingInput }
  | { ok: false; error: string };

/**
 * Only `value` and `source` are kept: the original gateway spread the whole
 * client payload into the broadcast, so any client could push arbitrary
 * fields to every other client.
 */
export function validateReading(
  payload: unknown,
  defaultSource = 'client',
): ValidationResult {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload)
  ) {
    return { ok: false, error: 'payload must be an object' };
  }
  const { value, source } = payload as Record<string, unknown>;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { ok: false, error: 'value must be a finite number' };
  }
  if (value < VALUE_MIN || value > VALUE_MAX) {
    return {
      ok: false,
      error: `value must be between ${VALUE_MIN} and ${VALUE_MAX}`,
    };
  }
  if (source === undefined) {
    return { ok: true, reading: { value, source: defaultSource } };
  }
  if (typeof source !== 'string' || !SOURCE_PATTERN.test(source.trim())) {
    return {
      ok: false,
      error:
        'source must be 1-40 letters, digits, spaces, dots, dashes or underscores',
    };
  }
  return { ok: true, reading: { value, source: source.trim() } };
}

/** Readings at or below the threshold are dropped, as in the original brief. */
export function passesFilter(reading: ReadingInput): boolean {
  return reading.value > FILTER_THRESHOLD;
}

export function severityOf(value: number): ProcessedReading['severity'] {
  return value > HIGH_THRESHOLD ? 'high' : 'normal';
}
