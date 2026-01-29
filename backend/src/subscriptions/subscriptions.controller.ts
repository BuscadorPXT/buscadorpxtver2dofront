import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import type { RenewSubscriptionDto } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Subscription, SubscriptionStatus, RenewalRecord } from './entities/subscription.entity';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async findAll(
    @Query('status') status?: SubscriptionStatus,
    @Query('expiringInDays') expiringInDays?: string,
    @Query('isActive') isActive?: string,
  ): Promise<Subscription[]> {
    const filters: any = {};

    if (status) {
      filters.status = status;
    }

    if (expiringInDays) {
      filters.expiringInDays = parseInt(expiringInDays, 10);
    }

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    return this.subscriptionsService.findAll(filters);
  }

  @Get('expiring/:days')
  async getExpiringUsers(@Param('days') days: string): Promise<Subscription[]> {
    return this.subscriptionsService.getExpiringUsers(parseInt(days, 10));
  }

  @Get('expired')
  async getExpiredUsers(): Promise<Subscription[]> {
    return this.subscriptionsService.getExpiredUsers();
  }

  @Get('active')
  async getActiveUsers(): Promise<Subscription[]> {
    return this.subscriptionsService.getActiveUsers();
  }

  @Get('inactive')
  async getInactiveUsers(): Promise<Subscription[]> {
    return this.subscriptionsService.getInactiveUsers();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Subscription> {
    return this.subscriptionsService.findOne(id);
  }

  @Post(':id/renew')
  async renewSubscription(
    @Param('id') id: string,
    @Body() renewDto: RenewSubscriptionDto,
  ): Promise<Subscription> {
    return this.subscriptionsService.renewSubscription(id, renewDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: SubscriptionStatus,
  ): Promise<Subscription> {
    return this.subscriptionsService.updateSubscriptionStatus(id, status);
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string): Promise<Subscription> {
    return this.subscriptionsService.deactivateSubscription(id);
  }

  @Post('update-statuses')
  async updateStatuses(): Promise<{ message: string }> {
    await this.subscriptionsService.updateSubscriptionStatuses();
    return { message: 'Subscription statuses updated successfully' };
  }

  @Get('me/hours')
  @UseGuards(JwtAuthGuard)
  async getMyHours(@Request() req): Promise<{ 
    available: number; 
    used: number; 
    remaining: number; 
    durationType?: 'hours' | 'days';
    daysRemaining?: number;
  }> {
    return this.subscriptionsService.getUserHours(req.user.id);
  }

  @Post('me/add-hours')
  @UseGuards(JwtAuthGuard)
  async addHoursToMySubscription(
    @Request() req,
    @Body('hours') hours: number,
  ): Promise<Subscription> {
    return this.subscriptionsService.addHours(req.user.id, hours);
  }

  @Post('freemium')
  async createFreemium(
    @Body('userId') userId: string,
    @Body('hours') hours?: number,
  ): Promise<Subscription> {
    return this.subscriptionsService.createFreemiumSubscription(userId, hours);
  }

  @Post('apply-plan')
  @UseGuards(JwtAuthGuard)
  async applyPlanToUser(
    @Body('userId') userId: string,
    @Body('planId') planId: string,
    @Body('startDate') startDate?: string,
    @Body('endDate') endDate?: string,
  ): Promise<Subscription> {
    return this.subscriptionsService.applyPlanToUser(userId, planId, startDate, endDate);
  }

  @Get('me/payment-history')
  @UseGuards(JwtAuthGuard)
  async getMyPaymentHistory(@Request() req): Promise<{
    subscription: Subscription;
    history: RenewalRecord[];
    totalPaid: number;
    totalRenewals: number;
  }> {
    return this.subscriptionsService.getUserPaymentHistory(req.user.id);
  }
}
