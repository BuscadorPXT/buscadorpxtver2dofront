// events.controller.ts
import { Controller, Get, Sse } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { EventService } from './events.service';

@Controller()
export class EventsController {
  constructor(private readonly event: EventService) {}

  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.event.events$.pipe(
      map((data) => ({ data } as MessageEvent)),
    );
  }

  @Get('version')
  version() {
    return { version: this.event.getVersion() };
  }
}
