import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';

export interface CacheUpdateEvent {
  type: 'cache-updated' | 'cache-regenerating';
  date: string;
  timestamp: string;
  totalProducts?: number;
  totalSuppliers?: number;
}

@Injectable()
export class CacheEventsService {
  private readonly logger = new Logger(CacheEventsService.name);
  private readonly cacheUpdates$ = new Subject<CacheUpdateEvent>();

  getUpdates(): Observable<CacheUpdateEvent> {
    return this.cacheUpdates$.asObservable();
  }

  emitCacheUpdated(date: string, totalProducts: number, totalSuppliers: number): void {
    const event: CacheUpdateEvent = {
      type: 'cache-updated',
      date,
      timestamp: new Date().toISOString(),
      totalProducts,
      totalSuppliers,
    };
    
    console.log(`📡 Emitindo evento de cache atualizado: ${date} (${totalProducts} produtos)`);
    this.cacheUpdates$.next(event);
  }

  emitCacheRegenerating(date: string): void {
    const event: CacheUpdateEvent = {
      type: 'cache-regenerating',
      date,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`📡 Emitindo evento de regeneração iniciada: ${date}`);
    this.cacheUpdates$.next(event);
  }
}
