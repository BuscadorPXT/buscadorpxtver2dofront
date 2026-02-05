import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventService } from './events.service';

@Module({
  imports: [],
  controllers: [EventsController],
  providers: [EventService],
  exports: [EventService],
})
export class EventsModule {}
