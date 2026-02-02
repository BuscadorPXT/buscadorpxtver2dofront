import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, ValidationPipe, ParseIntPipe } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  async findAll() {
    return await this.partnersService.findAll();
  }

  @Get('active')
  async findActive() {
    return await this.partnersService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.partnersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async create(@Body(ValidationPipe) createPartnerDto: CreatePartnerDto) {
    return await this.partnersService.create(createPartnerDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updatePartnerDto: UpdatePartnerDto,
  ) {
    return await this.partnersService.update(id, updatePartnerDto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async toggleActive(@Param('id', ParseIntPipe) id: number) {
    return await this.partnersService.toggleActive(id);
  }

  @Patch(':id/order')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body('displayOrder', ParseIntPipe) displayOrder: number,
  ) {
    return await this.partnersService.updateOrder(id, displayOrder);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.partnersService.remove(id);
    return { message: 'Partner deleted successfully' };
  }
}
