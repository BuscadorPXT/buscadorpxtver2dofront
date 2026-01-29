import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { WhatsAppLog } from './entities/whatsapp-log.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsGateway } from './notifications.gateway';
import { ZApiService } from './zapi.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, WhatsAppLog, Subscription, User]),
    ConfigModule,
    forwardRef(() => SettingsModule),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, ZApiService, NotificationSchedulerService],
  exports: [NotificationsService, NotificationsGateway, ZApiService, NotificationSchedulerService],
})
export class NotificationsModule {}
