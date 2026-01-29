import { Controller, Get, Put, Delete, Param, UseGuards, Body, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PresenceGateway } from '../presence/presence.gateway';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private presenceGateway: PresenceGateway,
  ) {}

  @Get('me/notification-preferences')
  async getMyNotificationPreferences(@Request() req) {
    return await this.usersService.getNotificationPreferences(req.user.userId);
  }

  @Put('me/notification-preferences')
  async updateMyNotificationPreferences(
    @Request() req,
    @Body() preferences: {
      enableWhatsAppNotifications?: boolean;
      enableEmailNotifications?: boolean;
      enableBillingNotifications?: boolean;
    },
  ) {
    return await this.usersService.updateNotificationPreferences(req.user.userId, preferences);
  }

  @Get()
  @UseGuards(AdminGuard)
  async findAll() {
    return await this.usersService.findAll();
  }

  @Put(':id/approve')
  @UseGuards(AdminGuard)
  async approveUser(@Param('id') id: string) {
    return await this.usersService.approveUser(+id);
  }

  @Put(':id/make-admin')
  @UseGuards(AdminGuard)
  async makeAdmin(@Param('id') id: string) {
    return await this.usersService.makeAdmin(+id);
  }

  @Put(':id/remove-admin')
  @UseGuards(AdminGuard)
  async removeAdmin(@Param('id') id: string) {
    return await this.usersService.removeAdmin(+id);
  }

  @Put(':id/toggle-active')
  @UseGuards(AdminGuard)
  async toggleActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    const result = await this.usersService.toggleActive(+id, isActive);

    if (!isActive) {
      this.presenceGateway.forceUserLogout(+id);
    }
    
    return result;
  }

  @Put(':id/max-concurrent-ips')
  @UseGuards(AdminGuard)
  async updateMaxConcurrentIps(
    @Param('id') id: string,
    @Body('maxConcurrentIps') maxConcurrentIps: number | null,
  ) {
    const result = await this.usersService.updateMaxConcurrentIps(+id, maxConcurrentIps);

    this.presenceGateway.forceUserLogout(+id);
    
    return result;
  }

  @Put(':id/billing-notifications')
  @UseGuards(AdminGuard)
  async updateBillingNotifications(
    @Param('id') id: string,
    @Body('enableBillingNotifications') enableBillingNotifications: boolean,
  ) {
    return await this.usersService.updateNotificationPreferences(+id, { enableBillingNotifications });
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async delete(@Param('id') id: string) {
    return await this.usersService.delete(+id);
  }
}
