import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PresenceGateway } from './presence.gateway';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UserSession } from './entities/user-session.entity';
import { PageView } from './entities/page-view.entity';
import { LocationStats } from './entities/location-stats.entity';
import { PageStats } from './entities/page-stats.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserSession,
      PageView,
      LocationStats,
      PageStats,
      User,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    forwardRef(() => SubscriptionsModule),
  ],
  controllers: [AnalyticsController],
  providers: [PresenceGateway, AnalyticsService],
  exports: [PresenceGateway, AnalyticsService],
})
export class PresenceModule {
  constructor(private readonly presenceGateway: PresenceGateway) {
    console.log('🚀🚀🚀 [PresenceModule] ========================================');
    console.log('🚀🚀🚀 [PresenceModule] MODULE LOADED AND INITIALIZED');
    console.log('🚀🚀🚀 [PresenceModule] PresenceGateway instance:', !!presenceGateway);
    console.log('🚀🚀🚀 [PresenceModule] ========================================');
  }
}
