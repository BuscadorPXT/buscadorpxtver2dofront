import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { SheetsModule } from './sheets/sheets.module';
import { PresenceModule } from './presence/presence.module';
import { CacheModule } from './cache/cache.module';
import { EncryptionModule } from './encryption/encryption.module';
import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Supplier } from './suppliers/entities/supplier.entity';
import { Subscription } from './subscriptions/entities/subscription.entity';
import { Plan } from './plans/entities/plan.entity';
import { Notification } from './notifications/entities/notification.entity';
import { WhatsAppLog } from './notifications/entities/whatsapp-log.entity';
import { SystemSettings } from './settings/entities/system-settings.entity';
import { UserSession } from './presence/entities/user-session.entity';
import { PageView } from './presence/entities/page-view.entity';
import { LocationStats } from './presence/entities/location-stats.entity';
import { PageStats } from './presence/entities/page-stats.entity';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PlansModule } from './plans/plans.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';
import { SessionsModule } from './sessions/sessions.module';
import { PartnersModule } from './partners/partners.module';
import { UploadModule } from './upload/upload.module';
import { SupplierClicksModule } from './supplier-clicks/supplier-clicks.module';
import { Partner } from './partners/entities/partner.entity';
import { SupplierClick } from './supplier-clicks/entities/supplier-click.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'pxt',
      entities: [User, Product, Supplier, Subscription, Plan, Notification, WhatsAppLog, SystemSettings, UserSession, PageView, LocationStats, PageStats, Partner, SupplierClick],
      synchronize: false,
      logging: false,
    }),
    CacheModule,
    EncryptionModule,
    AuthModule, 
    UsersModule, 
    ProductsModule, 
    SuppliersModule,
    SheetsModule,
    PresenceModule,
    SubscriptionsModule,
    PlansModule,
    NotificationsModule,
    SettingsModule,
    SessionsModule,
    PartnersModule,
    UploadModule,
    SupplierClicksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
