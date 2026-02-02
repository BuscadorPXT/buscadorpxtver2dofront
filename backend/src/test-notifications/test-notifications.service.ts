import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { TestMessageLog } from './entities/test-message-log.entity';
import { User } from '../users/entities/user.entity';
import { ZApiService } from '../notifications/zapi.service';
import { WhatsAppMessageType } from '../notifications/entities/whatsapp-log.entity';

@Injectable()
export class TestNotificationsService {
  private readonly logger = new Logger(TestNotificationsService.name);

  constructor(
    @InjectRepository(TestMessageLog)
    private testMessageLogRepository: Repository<TestMessageLog>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private zapiService: ZApiService,
  ) {}

  async sendTestMessage(
    userId: number,
    messageType: '6h_before' | '1h_before' | 'post_test',
    testEndTime: Date,
  ): Promise<TestMessageLog> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['plan'],
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const alreadySent = await this.testMessageLogRepository.findOne({
      where: {
        userId,
        messageType,
      },
    });

    if (alreadySent) {
      this.logger.log(`Message type ${messageType} already sent to user ${userId}`);
      return alreadySent;
    }

    const messageContent = this.buildMessage(messageType, testEndTime, user.name);

    let whatsappResponse: any = null;
    let status: 'sent' | 'failed' | 'pending' = 'pending';

    try {
      if (user.phone) {
        whatsappResponse = await this.zapiService.sendTextMessage({
          phone: user.phone,
          message: messageContent,
          userId: userId.toString(),
          messageType: WhatsAppMessageType.TEST_NOTIFICATION,
        });
        status = 'sent';
        this.logger.log(`Test message ${messageType} sent to user ${userId} (${user.phone})`);
      } else {
        this.logger.warn(`User ${userId} has no WhatsApp number`);
        status = 'failed';
      }
    } catch (error) {
      this.logger.error(`Error sending test message to user ${userId}:`, error);
      status = 'failed';
      whatsappResponse = { error: error.message };
    }

    const log = this.testMessageLogRepository.create({
      userId,
      messageType,
      testEndTime,
      messageContent,
      whatsappResponse,
      status,
      sentAt: new Date(),
    });

    return await this.testMessageLogRepository.save(log);
  }

  private buildMessage(
    messageType: '6h_before' | '1h_before' | 'post_test',
    testEndTime: Date,
    userName?: string,
  ): string {
    const greeting = userName ? `Olá, ${userName}! 👋` : 'Olá! 👋';
    const endTimeStr = testEndTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });

    if (messageType === '6h_before') {
      return `${greeting}\nSeu período de teste no Buscador PXT está acabando!\n⏰ Seu acesso encerra às ${endTimeStr}.\nAproveite para explorar todas as funcionalidades antes do término. Qualquer dúvida, estamos à disposição!`;
    }

    if (messageType === '1h_before') {
      return `${greeting}\nSeu período de teste no Buscador PXT está acabando em 1 HORA!\n⏰ Seu acesso encerra às ${endTimeStr}.\nAproveite os últimos minutos para explorar o sistema. Estamos à disposição!`;
    }

    if (messageType === 'post_test') {
      return `${greeting}\nSeu período de teste no Buscador PXT terminou.\nGostaríamos muito de saber sua opinião:\n\n❓ O que achou do sistema?\n❓ Faz sentido para o seu negócio?\n❓ Tem alguma dúvida ou sugestão?\n\nEstamos aqui para ajudar! Se quiser continuar usando, temos planos a partir de R$289,90 💰`;
    }

    return '';
  }

  async getUsersForTestNotification(
    messageType: '6h_before' | '1h_before' | 'post_test',
  ): Promise<User[]> {
    const now = new Date();
    let targetTime: Date;

    if (messageType === '6h_before') {
      targetTime = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    } else if (messageType === '1h_before') {
      targetTime = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    } else {
      targetTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    }

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.plan', 'plan')
      .where('plan.isTestPlan = :isTestPlan', { isTestPlan: true })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.phone IS NOT NULL')
      .getMany();

    const usersToNotify: User[] = [];

    for (const user of users) {
      const testEndTime = this.calculateTestEndTime(user);

      if (!testEndTime) continue;

      const alreadySent = await this.testMessageLogRepository.findOne({
        where: {
          userId: user.id,
          messageType,
        },
      });

      if (alreadySent) continue;

      const timeDiff = Math.abs(testEndTime.getTime() - targetTime.getTime());
      const fiveMinutes = 5 * 60 * 1000;

      if (timeDiff < fiveMinutes) {
        usersToNotify.push(user);
      }
    }

    return usersToNotify;
  }

  private calculateTestEndTime(user: User): Date | null {
    if (!user.plan || !user.createdAt) return null;

    const testDuration = user.plan.durationType === 'hours' 
      ? Number(user.plan.hours) * 60 * 60 * 1000
      : Number(user.plan.hours) * 24 * 60 * 60 * 1000;

    return new Date(user.createdAt.getTime() + testDuration);
  }

  async getMessageLogs(userId?: number): Promise<TestMessageLog[]> {
    if (userId) {
      return await this.testMessageLogRepository.find({
        where: { userId },
        order: { sentAt: 'DESC' },
      });
    }

    return await this.testMessageLogRepository.find({
      order: { sentAt: 'DESC' },
      take: 100,
    });
  }
}
