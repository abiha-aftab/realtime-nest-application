import { type DynamicModule, Module } from '@nestjs/common';
import { STREAM_CONFIG, type StreamConfig } from './config';
import { HealthController } from './health.controller';
import { ReadingGateway } from './stream/reading.gateway';
import { ReadingStreamService } from './stream/reading-stream.service';

@Module({})
export class AppModule {
  static forConfig(config: StreamConfig): DynamicModule {
    return {
      module: AppModule,
      controllers: [HealthController],
      providers: [
        { provide: STREAM_CONFIG, useValue: config },
        ReadingStreamService,
        ReadingGateway,
      ],
    };
  }
}
