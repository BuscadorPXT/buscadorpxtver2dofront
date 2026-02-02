import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestNotificationsService } from './test-notifications.service';
import { TestNotificationsCronService } from './test-notifications-cron.service';
import { TestMessageLog } from './entities/test-message-log.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestMessageLog, User]),
    forwardRef(() => NotificationsModule),
  ],
  providers: [TestNotificationsService, TestNotificationsCronService],
  exports: [TestNotificationsService],
})
export class TestNotificationsModule {}
