import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SheetsService } from './sheets.service';
import { SheetsController } from './sheets.controller';
import { SheetsCronService } from './sheets-cron.service';
import { Product } from '../products/entities/product.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Supplier]),
  ],
  controllers: [SheetsController],
  providers: [SheetsService, SheetsCronService],
  exports: [SheetsService],
})
export class SheetsModule {}
