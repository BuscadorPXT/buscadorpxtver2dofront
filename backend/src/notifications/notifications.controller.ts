import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SendWhatsAppMessageDto, SendWhatsAppImageDto, SendWhatsAppButtonDto, SendProductNotificationDto } from './dto/send-whatsapp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ZApiService } from './zapi.service';
import { WhatsAppMessageType } from './entities/whatsapp-log.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly zapiService: ZApiService,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  findAll() {
    return this.notificationsService.findAll();
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  @Get('me')
  findMyNotifications(@Request() req) {
    return this.notificationsService.findByUserId(req.user.userId);
  }

  @Get('me/unread')
  findMyUnreadNotifications(@Request() req) {
    return this.notificationsService.findUnreadByUserId(req.user.userId);
  }

  @Get('me/unread/count')
  async countMyUnreadNotifications(@Request() req) {
    const count = await this.notificationsService.countUnreadByUserId(req.user.userId);
    return { count };
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Post('me/read-all')
  markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Get('whatsapp/status')
  @UseGuards(AdminGuard)
  async checkWhatsAppConnection() {
    const connected = await this.zapiService.checkConnection();
    return { connected };
  }

  @Post('whatsapp/send-text')
  @UseGuards(AdminGuard)
  async sendWhatsAppText(@Body() dto: SendWhatsAppMessageDto) {
    return await this.zapiService.sendTextMessage(dto);
  }

  @Post('whatsapp/send-image')
  @UseGuards(AdminGuard)
  async sendWhatsAppImage(@Body() dto: SendWhatsAppImageDto) {
    return await this.zapiService.sendImage(dto);
  }

  @Post('whatsapp/send-button')
  @UseGuards(AdminGuard)
  async sendWhatsAppButton(@Body() dto: SendWhatsAppButtonDto) {
    return await this.zapiService.sendButtonMessage(dto);
  }

  @Post('whatsapp/send-product')
  @UseGuards(AdminGuard)
  async sendProductNotification(@Body() dto: SendProductNotificationDto) {
    return await this.zapiService.sendProductNotification(dto.phone, {
      name: dto.productName,
      supplier: dto.supplier,
      oldPrice: dto.oldPrice ? parseFloat(dto.oldPrice) : undefined,
      newPrice: parseFloat(dto.price),
      change: dto.change ? parseFloat(dto.change) : undefined,
      link: dto.link,
    });
  }

  @Post('whatsapp/test')
  @UseGuards(AdminGuard)
  async sendTestMessage(@Body() body: { phone: string }) {
    return await this.zapiService.sendTestMessage(body.phone);
  }

  @Post('whatsapp/test-expiring')
  @UseGuards(AdminGuard)
  async testExpiringNotification(@Body() body: { phone: string; daysRemaining: number; subscriptionId?: string }) {
    const { phone, daysRemaining, subscriptionId } = body;
    const subscription = {
      id: subscriptionId || 'test-subscription-id',
      endDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000),
      plan: { name: 'Plano Premium', durationInMonths: 1 },
    };

    let emoji = '⏰';
    if (daysRemaining <= 1) emoji = '🚨';
    else if (daysRemaining <= 2) emoji = '⚠️';

    const message = daysRemaining === 0
      ? `${emoji} *VENCE HOJE!*\n\nSua assinatura *${subscription.plan.name}* vence *HOJE*!\n\n⚠️ *ATENÇÃO:* Renove agora para manter seu acesso ativo.\n\n📅 Data de vencimento: ${subscription.endDate.toLocaleDateString('pt-BR')}\n\n💡 Entre em contato para renovar sua assinatura.`
      : `${emoji} *Aviso de Vencimento*\n\nSua assinatura *${subscription.plan.name}* vence em *${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}*.\n\n📅 Data de vencimento: ${subscription.endDate.toLocaleDateString('pt-BR')}\n\n💡 Renove com antecedência para não perder o acesso.`;

    return await this.zapiService.sendTextMessage({
      phone,
      message,
      userId: 'test-user',
      messageType: WhatsAppMessageType.SUBSCRIPTION_REMINDER,
    });
  }

  @Post('whatsapp/test-expired')
  @UseGuards(AdminGuard)
  async testExpiredNotification(@Body() body: { phone: string; subscriptionId?: string }) {
    const { phone, subscriptionId } = body;
    const subscription = {
      id: subscriptionId || 'test-subscription-id',
      endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      plan: { name: 'Plano Premium' },
    };

    const message = `🚫 *Assinatura Vencida*\n\nSua assinatura *${subscription.plan.name}* venceu em ${subscription.endDate.toLocaleDateString('pt-BR')}.\n\n❌ *Acesso bloqueado*\n\nPara reativar seu acesso, entre em contato conosco para renovar sua assinatura.\n\n📞 Fale conosco para mais informações.`;

    return await this.zapiService.sendTextMessage({
      phone,
      message,
      userId: 'test-user',
      messageType: WhatsAppMessageType.SUBSCRIPTION_EXPIRED,
    });
  }

  @Post('whatsapp/test-tester-expired')
  @UseGuards(AdminGuard)
  async testTesterExpiredNotification(@Body() body: { phone: string }) {
    const { phone } = body;
    const message = `⏱️ *Período de Teste Expirado*\n\nSeu período de teste de 3 horas chegou ao fim.\n\n✨ *Gostou do sistema?*\n\nAssine agora e tenha acesso ilimitado a todos os recursos:\n\n✅ Análise completa de produtos\n✅ Acompanhamento de preços\n✅ Relatórios detalhados\n✅ Notificações em tempo real\n\n💎 Entre em contato para conhecer nossos planos!`;

    return await this.zapiService.sendTextMessage({
      phone,
      message,
      userId: 'test-user',
      messageType: WhatsAppMessageType.TESTER_EXPIRED,
    });
  }
}
