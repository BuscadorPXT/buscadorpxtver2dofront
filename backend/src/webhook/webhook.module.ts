import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { SheetsModule } from '../sheets/sheets.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [SheetsModule, EventsModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [],
})
export class WebhookModule {}
