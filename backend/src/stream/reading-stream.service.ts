import { Inject, Injectable } from '@nestjs/common';
import { STREAM_CONFIG, type StreamConfig } from '../config';
import { EventHistory } from './event-history';
import {
  passesFilter,
  severityOf,
  type ProcessedReading,
  type ReadingInput,
} from './reading';

@Injectable()
export class ReadingStreamService {
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
}
