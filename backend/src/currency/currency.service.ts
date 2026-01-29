import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface DollarQuote {
  currentRate: number;
  previousRate: number;
  variation: number;
  variationPercent: number;
  timestamp: Date;
}

@Injectable()
export class CurrencyService {
  private cachedQuote: DollarQuote | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  async getDollarQuote(): Promise<DollarQuote> {
    const now = Date.now();

    if (this.cachedQuote && now - this.lastFetchTime < this.CACHE_DURATION) {
      return this.cachedQuote;
    }

    try {

      const response = await axios.get(
        'https://economia.awesomeapi.com.br/json/daily/USD-BRL/2'
      );

      if (response.data && Array.isArray(response.data) && response.data.length >= 2) {
        const current = response.data[0];
        const previous = response.data[1];

        const currentRate = parseFloat(current.bid);
        const previousRate = parseFloat(previous.bid);
        const variation = currentRate - previousRate;
        const variationPercent = ((variation / previousRate) * 100);

        this.cachedQuote = {
          currentRate,
          previousRate,
          variation,
          variationPercent,
          timestamp: new Date(parseInt(current.timestamp) * 1000),
        };

        this.lastFetchTime = now;
        return this.cachedQuote;
      }

      return this.getFallbackQuote();
    } catch (error) {
      console.error('Erro ao buscar cotação do dólar:', error.message);

      if (this.cachedQuote) {
        return this.cachedQuote;
      }
      
      return this.getFallbackQuote();
    }
  }

  private getFallbackQuote(): DollarQuote {

    return {
      currentRate: 5.25,
      previousRate: 5.30,
      variation: -0.05,
      variationPercent: -0.94,
      timestamp: new Date(),
    };
  }
}
