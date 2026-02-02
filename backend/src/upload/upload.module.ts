import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { SystemSettings } from '../settings/entities/system-settings.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSettings])],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
