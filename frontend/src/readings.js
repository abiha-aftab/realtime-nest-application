export const CLIENT_LIMIT = 200;

/**
 * Merges readings by id (newest first) and caps the list. Replays after a
 * reconnect overlap with what the client already has, so ids dedupe them.
 */
export function mergeReadings(current, incoming, limit = CLIENT_LIMIT) {
  const byId = new Map(current.map((r) => [r.id, r]));
  for (const reading of incoming) byId.set(reading.id, reading);
  return [...byId.values()].sort((a, b) => b.id - a.id).slice(0, limit);
}

/** Applies a history snapshot; a new streamId means the server restarted. */
export function applySnapshot(state, snapshot, limit = CLIENT_LIMIT) {
  const sameStream = state.streamId === snapshot.streamId;
  return {
    streamId: snapshot.streamId,
    readings: mergeReadings(sameStream ? state.readings : [], snapshot.readings, limit),
  };
}

export function summarize(readings) {
  if (readings.length === 0) return { latest: null, high: 0, peak: null };
  return {
    latest: readings[0],
    high: readings.filter((r) => r.severity === 'high').length,
    peak: Math.max(...readings.map((r) => r.value)),
  };
}
