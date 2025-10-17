import { randomUUID } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { STREAM_CONFIG, type StreamConfig } from '../config';
import { EventHistory } from './event-history';
import {
  passesFilter,
  severityOf,
  type ProcessedReading,
  type ReadingInput,
} from './reading';

export interface HistorySnapshot {
  /** Changes on every server start; ids are only unique within one stream. */
  streamId: string;
  readings: ProcessedReading[];
}

@Injectable()
export class ReadingStreamService {
  readonly streamId = randomUUID();
  private readonly history: EventHistory<ProcessedReading>;
  private nextId = 1;

  constructor(@Inject(STREAM_CONFIG) config: StreamConfig) {
    this.history = new EventHistory(config.historySize);
  }

  /** Returns the processed reading, or null when it is filtered out. */
  ingest(reading: ReadingInput): ProcessedReading | null {
    if (!passesFilter(reading)) return null;
    const processed: ProcessedReading = {
      id: this.nextId++,
      value: reading.value,
      source: reading.source,
      severity: severityOf(reading.value),
      processedAt: new Date().toISOString(),
    };
    this.history.push(processed);
    return processed;
  }

  recent(): ProcessedReading[] {
    return this.history.snapshot();
  }

  snapshot(): HistorySnapshot {
    return { streamId: this.streamId, readings: this.recent() };
  }
}
