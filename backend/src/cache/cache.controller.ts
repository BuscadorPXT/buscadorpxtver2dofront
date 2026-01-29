import { Controller, Get, HttpException, HttpStatus, Post, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { CacheService } from './cache.service';
import { CacheEventsService } from './cache-events.gateway';

@Controller('cache')
export class CacheController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly cacheEventsService: CacheEventsService,
  ) { }

  @Sse('events')
  cacheEvents(): Observable<MessageEvent> {
    return this.cacheEventsService.getUpdates().pipe(
      map((event) => ({
        data: event,
        type: event.type,
      } as MessageEvent)),
    );
  }

  @Get('dates')
  async getAvailableDates() {
    const dates = await this.cacheService.getAvailableDates();
    return {
      dates,
      count: dates.length,
    };
  }

  @Get('payload')
  async getPayload(@Query('date') date?: string) {
    const payload = await this.cacheService.getCachedPayload(date);

    if (!payload) {
      throw new HttpException(
        date
          ? `Payload não disponível para a data ${date}. Verifique as datas disponíveis em /cache/dates`
          : 'Nenhum payload cacheado disponível. Tente novamente em alguns instantes.',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    return payload;
  }

  @Post('regenerate')
  async regeneratePayload(@Query('date') date?: string) {
    if (date) {

      await this.cacheService.generateAndCachePayloadForDate(date);
      return {
        message: `Payload regenerado com sucesso para data ${date}`,
        date,
        timestamp: new Date().toISOString()
      };
    } else {

      await this.cacheService.generateAndCachePayload();
      return {
        message: 'Payload regenerado com sucesso',
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('stats')
  getStats() {
    return this.cacheService.getStats();
  }

  @Get('clear')
  clearCache() {
    this.cacheService.invalidate();
    return { message: 'Cache em memória limpo com sucesso' };
  }
}
