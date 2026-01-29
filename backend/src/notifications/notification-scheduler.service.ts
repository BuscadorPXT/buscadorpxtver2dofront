import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, MoreThanOrEqual } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../subscriptions/entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { ZApiService } from './zapi.service';
import { WhatsAppLog, WhatsAppMessageType, WhatsAppLogStatus } from './entities/whatsapp-log.entity';

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(WhatsAppLog)
    private whatsappLogRepository: Repository<WhatsAppLog>,
    private zapiService: ZApiService,
  ) {}

  private async wasNotificationSentToday(userId: number, messageType: WhatsAppMessageType, subscriptionId?: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = await this.whatsappLogRepository.findOne({
      where: [
        {
          userId,
          messageType,
          status: WhatsAppLogStatus.SUCCESS,
          createdAt: MoreThanOrEqual(today),
        },
        {
          userId,
          messageType,
          status: WhatsAppLogStatus.PENDING,
          createdAt: MoreThanOrEqual(today),
        },
      ],
    });

    if (existingLog) {
      this.logger.debug(`Notificação ${messageType} já enviada/pendente hoje para usuário ${userId} (status: ${existingLog.status})`);
      return true;
    }

    return false;
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkSubscriptions() {
    console.log('Iniciando verificação de assinaturas...');
    
    await this.checkExpiringSoon();
    await this.checkExpired();
    await this.checkTesterExpired();
    
    console.log('Verificação de assinaturas concluída');
  }

  private async checkExpiringSoon() {
    const now = new Date();
    const notifications = [
      { days: 5, message: '5 dias' },
      { days: 3, message: '3 dias' },
      { days: 2, message: '2 dias' },
      { days: 1, message: 'amanhã' },
      { days: 0, message: 'hoje' },
    ];

    for (const notif of notifications) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() + notif.days);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);

      const subscriptions = await this.subscriptionRepository.find({
        where: {
          endDate: Between(startDate, endDate),
          status: SubscriptionStatus.ACTIVE,
          isActive: true,
          durationType: 'days',
        },
        relations: ['user'],
      });

      for (const subscription of subscriptions) {

        const alreadySent = await this.wasNotificationSentToday(
          subscription.user.id,
          WhatsAppMessageType.SUBSCRIPTION_REMINDER
        );
        
        if (!alreadySent) {
          await this.sendExpiringNotification(subscription, notif.days, notif.message);
        }
      }
    }
  }

  private async checkExpired() {
    const now = new Date();
    
    const expiredSubscriptions = await this.subscriptionRepository.find({
      where: {
        endDate: LessThan(now),
        status: SubscriptionStatus.ACTIVE,
        isActive: true,
      },
      relations: ['user'],
    });

    for (const subscription of expiredSubscriptions) {

      const alreadySent = await this.wasNotificationSentToday(
        subscription.user.id,
        WhatsAppMessageType.SUBSCRIPTION_EXPIRED
      );
      
      if (!alreadySent) {
        await this.sendExpiredNotification(subscription);

        subscription.status = SubscriptionStatus.EXPIRED;
        subscription.isActive = false;
        await this.subscriptionRepository.save(subscription);
      }
    }
  }

  private async checkTesterExpired() {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const expiredTesters = await this.subscriptionRepository.find({
      where: {
        durationType: 'hours',
        isFreemium: true,
        isActive: true,
        hoursStartedAt: LessThan(threeHoursAgo),
      },
      relations: ['user'],
    });

    for (const subscription of expiredTesters) {

      const alreadySent = await this.wasNotificationSentToday(
        subscription.user.id,
        WhatsAppMessageType.TESTER_EXPIRED
      );
      
      if (!alreadySent) {
        await this.sendTesterExpiredNotification(subscription);

        subscription.isActive = false;
        subscription.status = SubscriptionStatus.EXPIRED;
        await this.subscriptionRepository.save(subscription);
      }
    }
  }

  private async sendExpiringNotification(subscription: Subscription, daysRemaining: number, timeMessage: string) {
    const user = subscription.user;
    
    if (!user.phone || !user.enableWhatsAppNotifications) {
      this.logger.debug(`Usuário ${user.email} não tem telefone ou notificações desabilitadas`);
      return;
    }

    if (user.enableBillingNotifications === false) {
      this.logger.debug(`Usuário ${user.email} desabilitou notificações de cobrança`);
      return;
    }

    const message = this.formatExpiringMessage(user.name, timeMessage, subscription);

    try {
      await this.zapiService.sendTextMessage(
        { phone: user.phone, message },
        user.id,
        WhatsAppMessageType.SUBSCRIPTION_REMINDER
      );
      console.log(`Aviso de vencimento enviado para ${user.email} (${daysRemaining} dias)`);
    } catch (error) {
      this.logger.error(`Erro ao enviar aviso para ${user.email}:`, error);
    }
  }

  private async sendExpiredNotification(subscription: Subscription) {
    const user = subscription.user;
    
    if (!user.phone || !user.enableWhatsAppNotifications) {
      this.logger.debug(`Usuário ${user.email} não tem telefone ou notificações desabilitadas`);
      return;
    }

    if (user.enableBillingNotifications === false) {
      this.logger.debug(`Usuário ${user.email} desabilitou notificações de cobrança`);
      return;
    }

    const message = `
🚫 *ASSINATURA VENCIDA*

Olá, *${user.name}*!

Sua assinatura do Sistema de Análise de Produtos expirou e seu acesso foi bloqueado.

📅 *Data de Vencimento:* ${this.formatDate(subscription.endDate)}
💰 *Valor da Renovação:* R$ ${subscription.amount}

Para renovar sua assinatura e recuperar o acesso, entre em contato conosco.

_Mensagem automática do Sistema de Análise de Produtos_
    `.trim();

    try {
      await this.zapiService.sendTextMessage(
        { phone: user.phone, message },
        user.id,
        WhatsAppMessageType.SUBSCRIPTION_EXPIRED
      );
      console.log(`Aviso de bloqueio enviado para ${user.email}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar aviso de bloqueio para ${user.email}:`, error);
    }
  }

  private async sendTesterExpiredNotification(subscription: Subscription) {
    const user = subscription.user;
    
    if (!user.phone || !user.enableWhatsAppNotifications) {
      this.logger.debug(`Usuário ${user.email} não tem telefone ou notificações desabilitadas`);
      return;
    }

    if (user.enableBillingNotifications === false) {
      this.logger.debug(`Usuário ${user.email} desabilitou notificações de cobrança`);
      return;
    }

    const message = `
⏰ *PERÍODO DE TESTE ENCERRADO*

Olá, *${user.name}*!

Seu período de teste de 3 horas do Sistema de Análise de Produtos foi encerrado.

✨ Gostou da plataforma? Entre em contato conosco para conhecer nossos planos e continuar utilizando todas as funcionalidades!

💼 *Planos disponíveis:*
• Mensal
• Quinzenal
• Semanal

📞 Entre em contato para assinar!

_Mensagem automática do Sistema de Análise de Produtos_
    `.trim();

    try {
      await this.zapiService.sendTextMessage(
        { phone: user.phone, message },
        user.id,
        WhatsAppMessageType.TESTER_EXPIRED
      );
      console.log(`Aviso de teste expirado enviado para ${user.email}`);
    } catch (error) {
      this.logger.error(`Erro ao enviar aviso de teste expirado para ${user.email}:`, error);
    }
  }

  private formatExpiringMessage(userName: string, timeMessage: string, subscription: Subscription): string {
    let emoji = '⏰';
    if (timeMessage === 'hoje') emoji = '🚨';
    else if (timeMessage === 'amanhã') emoji = '⚠️';

    return `
${emoji} *AVISO DE VENCIMENTO*

Olá, *${userName}*!

Sua assinatura do Sistema de Análise de Produtos vence *${timeMessage}*!

📅 *Data de Vencimento:* ${this.formatDate(subscription.endDate)}
💰 *Valor da Renovação:* R$ ${subscription.amount}

Para evitar a interrupção do serviço, renove sua assinatura o quanto antes.

_Mensagem automática do Sistema de Análise de Produtos_
    `.trim();
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(new Date(date));
  }
}
