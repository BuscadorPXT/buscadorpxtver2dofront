import { Body, Controller, Post } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('sheets-update')
  async sheetsUpdate(@Body() data: CreateWebhookDto) {
    // console.log(data)
    // console.log('Data:' , { aba: data.aba, linha: data.linha, coluna: data.coluna });

    this.webhookService.onSheetsUpdate();

    return { ok: true };
  }
}
