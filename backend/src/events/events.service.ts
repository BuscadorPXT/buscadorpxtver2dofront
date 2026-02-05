import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export type Event =
  | { type: 'products_updated'; version: number; at: string; date: string };

@Injectable()
export class EventService {
  private version = 0;
  private subject = new Subject<Event>();

  events$ = this.subject.asObservable();

  emitProductsUpdated(date: string) {
    this.version += 1;
    this.subject.next({
      type: 'products_updated',
      date,
      version: this.version,
      at: new Date().toISOString(),
    });
  }

  getVersion() {
    return this.version;
  }
}
