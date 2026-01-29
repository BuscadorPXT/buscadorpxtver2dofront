import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncryptionModule } from '../encryption/encryption.module';
import { Product } from '../products/entities/product.entity';
import { Supplier } from '../suppliers/entities/supplier.entity';
import { CacheController } from './cache.controller';
import { CacheService } from './cache.service';
import { CacheEventsService } from './cache-events.gateway';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Supplier]),
    EncryptionModule,
  ],
  controllers: [CacheController],
  providers: [CacheService, CacheEventsService],
  exports: [CacheService, CacheEventsService],
})
export class CacheModule { }
