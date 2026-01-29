import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

@Controller('suppliers')
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Get()
  async findAll() {
    return this.suppliersService.findAll();
  }

  @Get('stats')
  async getStats(@Query('date') date?: string) {
    return this.suppliersService.getSuppliersStats(date);
  }

  @Get('details')
  async getDetails(
    @Query('supplierName') supplierName: string,
    @Query('date') date?: string,
  ) {
    return this.suppliersService.getSupplierDetails(supplierName, date);
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    return this.suppliersService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body(ValidationPipe) supplierData: CreateSupplierDto) {
    return await this.suppliersService.create(supplierData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(@Param('id') id: number, @Body(ValidationPipe) supplierData: UpdateSupplierDto) {
    return await this.suppliersService.update(id, supplierData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async delete(@Param('id') id: number) {
    return await this.suppliersService.delete(id);
  }
}
