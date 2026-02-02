import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SupplierClicksService } from './supplier-clicks.service';
import { RegisterClickDto, ClickMetricsQueryDto } from './dto/supplier-click.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('supplier-clicks')
export class SupplierClicksController {
  constructor(private readonly clicksService: SupplierClicksService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  async registerClick(@Request() req, @Body() dto: RegisterClickDto) {
    return await this.clicksService.registerClick(req.user.id, dto);
  }

  @Get('metrics/suppliers')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getSupplierMetrics(@Query() query: ClickMetricsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    
    return await this.clicksService.getSupplierMetrics(startDate, endDate);
  }

  @Get('metrics/top-products')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getTopProducts(@Query() query: ClickMetricsQueryDto & { supplierId: number; limit?: number }) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    const limit = query.limit ? parseInt(query.limit.toString()) : 10;
    
    return await this.clicksService.getTopProductsBySupplier(
      query.supplierId,
      startDate,
      endDate,
      limit,
    );
  }

  @Get('metrics/timeline')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getClickTimeline(@Query() query: ClickMetricsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    
    return await this.clicksService.getClicksByPeriod(startDate, endDate, query.supplierId);
  }

  @Get('metrics/total')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getTotalClicks(@Query() query: ClickMetricsQueryDto) {
    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;
    
    const total = await this.clicksService.getTotalClicks(query.supplierId, startDate, endDate);
    return { total };
  }
}
