import { Controller, Post, Get, UseGuards, Param } from '@nestjs/common';
import { SheetsService } from './sheets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('sheets')
export class SheetsController {
  constructor(private sheetsService: SheetsService) {}

  @Post('sync')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async syncProducts() {
    this.sheetsService.syncProducts().catch(error => {
      console.error('Erro na sincronização assíncrona:', error);
    });

    return {
      success: true,
      message: 'Sincronização iniciada em background',
      status: 'processing',
    };
  }

  @Get('sync/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getSyncStatus() {
    return this.sheetsService.getSyncStatus();
  }

  @Get('latest')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getMostRecentSheet() {
    const sheetName = await this.sheetsService.getMostRecentSheet();
    return {
      sheetName,
      message: sheetName ? `Aba mais recente: ${sheetName}` : 'Nenhuma aba encontrada',
    };
  }

  @Get('dates')
  async getAvailableDates() {
    const dates = await this.sheetsService.getAvailableDates();
    return {
      dates,
      count: dates.length,
    };
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStats() {
    return this.sheetsService.getSyncStats();
  }

  @Get('compare/:sheetDate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async compareSheetWithDatabase(@Param('sheetDate') sheetDate: string) {
    return this.sheetsService.compareSheetWithDatabase(sheetDate);
  }

  @Get('duplicates/:sheetDate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async findDuplicates(@Param('sheetDate') sheetDate: string) {
    return this.sheetsService.findDuplicatesInSheet(sheetDate);
  }
}
