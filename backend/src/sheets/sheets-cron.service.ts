import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SheetsService } from './sheets.service';

@Injectable()
export class SheetsCronService {
  private readonly logger = new Logger(SheetsCronService.name);

  constructor(private sheetsService: SheetsService) {}

  async handleHourlySync() {
    console.log('Executando sincronização automática (horária)...');
    
    try {
      const result = await this.sheetsService.syncProducts();
      console.log(
        `Sincronização automática concluída: ${result.added} adicionados, ${result.updated} atualizados`,
      );
    } catch (error) {
      this.logger.error('Erro na sincronização automática:', error);
    }
  }

  async handleDailySync() {
    console.log('Executando sincronização diária (6h)...');
    
    try {
      const result = await this.sheetsService.syncProducts();
      console.log(
        `Sincronização diária concluída: ${result.added} adicionados, ${result.updated} atualizados`,
      );
    } catch (error) {
      this.logger.error('Erro na sincronização diária:', error);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleFrequentSync() {
    console.log('Executando sincronização frequente (10s)...');

    try {
      const result = await this.sheetsService.syncProducts();
      console.log(
        `Sincronização frequente concluída: ${result.added} adicionados, ${result.updated} atualizados`,
      );
    } catch (error) {
      this.logger.error('Erro na sincronização frequente:', error);
    }
  }
}
