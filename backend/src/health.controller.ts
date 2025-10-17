import { Controller, Get } from '@nestjs/common';
import type { ProcessedReading } from './stream/reading';
import { ReadingStreamService } from './stream/reading-stream.service';

@Controller('api')
export class HealthController {
  constructor(private readonly stream: ReadingStreamService) {}

  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('readings')
  readings(): ProcessedReading[] {
    return this.stream.recent();
  }
}
