import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TestNotificationsService } from './test-notifications.service';

@Injectable()
export class TestNotificationsCronService {
  private readonly logger = new Logger(TestNotificationsCronService.name);

  constructor(private testNotificationsService: TestNotificationsService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleTestNotifications() {
    this.logger.log('Running test notifications cron job');

    try {
      await this.check6HoursBefore();
      await this.check1HourBefore();
      await this.checkPostTest();
    } catch (error) {
      this.logger.error('Error in test notifications cron:', error);
    }
  }

  private async check6HoursBefore() {
    try {
      const users = await this.testNotificationsService.getUsersForTestNotification('6h_before');
      this.logger.log(`Found ${users.length} users for 6h_before notification`);

      for (const user of users) {
        try {
          const testEndTime = this.calculateTestEndTime(user);
          if (testEndTime) {
            await this.testNotificationsService.sendTestMessage(
              user.id,
              '6h_before',
              testEndTime,
            );
          }
        } catch (error) {
          this.logger.error(`Error sending 6h_before message to user ${user.id}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in check6HoursBefore:', error);
    }
  }

  private async check1HourBefore() {
    try {
      const users = await this.testNotificationsService.getUsersForTestNotification('1h_before');
      this.logger.log(`Found ${users.length} users for 1h_before notification`);

      for (const user of users) {
        try {
          const testEndTime = this.calculateTestEndTime(user);
          if (testEndTime) {
            await this.testNotificationsService.sendTestMessage(
              user.id,
              '1h_before',
              testEndTime,
            );
          }
        } catch (error) {
          this.logger.error(`Error sending 1h_before message to user ${user.id}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in check1HourBefore:', error);
    }
  }

  private async checkPostTest() {
    try {
      const users = await this.testNotificationsService.getUsersForTestNotification('post_test');
      this.logger.log(`Found ${users.length} users for post_test notification`);

      for (const user of users) {
        try {
          const testEndTime = this.calculateTestEndTime(user);
          if (testEndTime) {
            await this.testNotificationsService.sendTestMessage(
              user.id,
              'post_test',
              testEndTime,
            );
          }
        } catch (error) {
          this.logger.error(`Error sending post_test message to user ${user.id}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in checkPostTest:', error);
    }
  }

  private calculateTestEndTime(user: any): Date | null {
    if (!user.plan || !user.createdAt) return null;

    const testDuration = user.plan.durationType === 'hours' 
      ? Number(user.plan.hours) * 60 * 60 * 1000
      : Number(user.plan.hours) * 24 * 60 * 60 * 1000;

    return new Date(user.createdAt.getTime() + testDuration);
  }
}
