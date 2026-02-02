import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierClicksService } from './supplier-clicks.service';
import { SupplierClicksController } from './supplier-clicks.controller';
import { SupplierClick } from './entities/supplier-click.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SupplierClick])],
  controllers: [SupplierClicksController],
  providers: [SupplierClicksService],
  exports: [SupplierClicksService],
})
export class SupplierClicksModule {}
