import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { WhatsAppLog, WhatsAppMessageType, WhatsAppLogStatus } from './entities/whatsapp-log.entity';
import { SettingsService } from '../settings/settings.service';

export interface ZApiSendMessageDto {
  phone: string;
  message: string;
  userId?: string;
  messageType?: WhatsAppMessageType;
}

export interface ZApiSendImageDto {
  phone: string;
  image: string;
  caption?: string;
}

export interface ZApiSendDocumentDto {
  phone: string;
  document: string;
  fileName?: string;
}

export interface ZApiSendButtonDto {
  phone: string;
  message: string;
  buttons: Array<{
    id: string;
    label: string;
  }>;
}

@Injectable()
export class ZApiService {
  private readonly logger = new Logger(ZApiService.name);
  private readonly client: AxiosInstance;
  private instanceId: string;
  private token: string;
  private baseUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(WhatsAppLog)
    private whatsappLogRepository: Repository<WhatsAppLog>,
    @Inject(forwardRef(() => SettingsService))
    private settingsService: SettingsService,
  ) {

    this.instanceId = '';
    this.token = '';
    this.baseUrl = 'https://api.z-api.io';

    this.client = axios.create({
      timeout: 30000,
    });

    this.updateClientConfig();

    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`Z-API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Z-API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`Z-API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        this.logger.error('Z-API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private async updateClientConfig(): Promise<void> {
    try {
      const config = await this.settingsService.getZApiSettings();
      this.instanceId = config.instanceId;
      this.token = config.instanceToken;
      this.baseUrl = config.baseUrl;

      this.client.defaults.baseURL = `${this.baseUrl}/instances/${this.instanceId}/token/${this.token}`;
      this.client.defaults.headers['Content-Type'] = 'application/json';
      this.client.defaults.headers['Client-Token'] = config.clientToken;
    } catch (error) {
      this.logger.warn('Erro ao buscar configurações Z-API do banco, usando .env');
    }
  }

  async checkConnection(): Promise<boolean> {
    await this.updateClientConfig();
    try {
      const response = await this.client.get('/status');
      return response.data?.connected === true;
    } catch (error) {
      this.logger.error('Erro ao verificar conexão Z-API:', error);
      return false;
    }
  }

  async sendTextMessage(data: ZApiSendMessageDto, userId?: number, messageType?: WhatsAppMessageType): Promise<any> {
    await this.updateClientConfig();
    const phone = this.formatPhone(data.phone);

    let finalUserId: number | undefined = userId;
    if (!finalUserId && data.userId) {
      const parsed = parseInt(data.userId);
      finalUserId = isNaN(parsed) ? undefined : parsed;
    }
    const finalMessageType = messageType || data.messageType || WhatsAppMessageType.TEXT;

    const log = await this.createLog({
      userId: finalUserId,
      phone,
      messageType: finalMessageType,
      message: data.message,
      status: WhatsAppLogStatus.PENDING,
    });

    try {
      const response = await this.client.post('/send-text', {
        phone,
        message: data.message,
      });

      await this.updateLog(log.id, {
        status: WhatsAppLogStatus.SUCCESS,
        zapiMessageId: response.data?.messageId,
        sentAt: new Date(),
      });
      
      console.log(`Mensagem enviada para ${phone}`);
      return response.data;
    } catch (error) {

      await this.updateLog(log.id, {
        status: WhatsAppLogStatus.FAILED,
        errorMessage: error.response?.data?.message || error.message,
      });
      
      this.logger.error(`Erro ao enviar mensagem para ${data.phone}:`, error);
      throw error;
    }
  }

  async sendImage(data: ZApiSendImageDto): Promise<any> {
    try {
      const phone = this.formatPhone(data.phone);
      const response = await this.client.post('/send-image', {
        phone,
        image: data.image,
        caption: data.caption || '',
      });
      console.log(`Imagem enviada para ${phone}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao enviar imagem para ${data.phone}:`, error);
      throw error;
    }
  }

  async sendDocument(data: ZApiSendDocumentDto): Promise<any> {
    try {
      const phone = this.formatPhone(data.phone);
      const response = await this.client.post('/send-document', {
        phone,
        document: data.document,
        fileName: data.fileName || 'documento.pdf',
      });
      console.log(`Documento enviado para ${phone}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao enviar documento para ${data.phone}:`, error);
      throw error;
    }
  }

  async sendButtonMessage(data: ZApiSendButtonDto): Promise<any> {
    try {
      const phone = this.formatPhone(data.phone);
      const response = await this.client.post('/send-button-list', {
        phone,
        message: data.message,
        buttonList: {
          buttons: data.buttons.map(btn => ({
            id: btn.id,
            label: btn.label,
          })),
        },
      });
      console.log(`Mensagem com botões enviada para ${phone}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Erro ao enviar mensagem com botões para ${data.phone}:`, error);
      throw error;
    }
  }

  async sendProductNotification(phone: string, productData: {
    name: string;
    supplier: string;
    oldPrice?: number;
    newPrice: number;
    change?: number;
    link?: string;
  }, userId?: number): Promise<any> {
    const message = this.formatProductMessage(productData);
    return this.sendTextMessage({ phone, message }, userId, WhatsAppMessageType.PRODUCT_NOTIFICATION);
  }

  async sendPriceAlert(phone: string, productData: {
    name: string;
    supplier: string;
    price: number;
    threshold: number;
    link?: string;
  }, userId?: number): Promise<any> {
    const message = `
🚨 *ALERTA DE PREÇO*

📦 *Produto:* ${productData.name}
🏪 *Fornecedor:* ${productData.supplier}
💰 *Preço Atual:* R$ ${productData.price.toFixed(2)}
⚠️ *Limite Configurado:* R$ ${productData.threshold.toFixed(2)}

${productData.link ? `🔗 Ver detalhes: ${productData.link}` : ''}

_Mensagem automática do Sistema de Análise de Produtos_
    `.trim();

    return this.sendTextMessage({ phone, message }, userId, WhatsAppMessageType.PRICE_ALERT);
  }

  async sendProductReport(phone: string, reportData: {
    totalProducts: number;
    priceChanges: number;
    avgChange: number;
    period: string;
    link?: string;
  }, userId?: number): Promise<any> {
    const message = `
📊 *RELATÓRIO DE PRODUTOS*

📅 *Período:* ${reportData.period}
📦 *Total de Produtos:* ${reportData.totalProducts}
📈 *Alterações de Preço:* ${reportData.priceChanges}
📊 *Variação Média:* ${reportData.avgChange > 0 ? '+' : ''}${reportData.avgChange.toFixed(2)}%

${reportData.link ? `🔗 Ver relatório completo: ${reportData.link}` : ''}

_Relatório automático do Sistema de Análise de Produtos_
    `.trim();

    return this.sendTextMessage({ phone, message }, userId, WhatsAppMessageType.REPORT);
  }

  private formatPhone(phone: string): string {

    let cleaned = phone.replace(/\D/g, '');

    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }

    return cleaned;
  }

  private formatProductMessage(data: {
    name: string;
    supplier: string;
    oldPrice?: number;
    newPrice: number;
    change?: number;
    link?: string;
  }): string {
    let message = `
📦 *ATUALIZAÇÃO DE PRODUTO*

*Produto:* ${data.name}
🏪 *Fornecedor:* ${data.supplier}
`;

    if (data.oldPrice && data.change) {
      const changeEmoji = data.change > 0 ? '📈' : '📉';
      const changeSign = data.change > 0 ? '+' : '';
      message += `
💰 *Preço Anterior:* R$ ${data.oldPrice.toFixed(2)}
💵 *Preço Atual:* R$ ${data.newPrice.toFixed(2)}
${changeEmoji} *Variação:* ${changeSign}${data.change.toFixed(2)}%
`;
    } else {
      message += `
💵 *Preço:* R$ ${data.newPrice.toFixed(2)}
`;
    }

    if (data.link) {
      message += `
🔗 *Ver detalhes:* ${data.link}
`;
    }

    message += `
_Atualização automática do Sistema de Análise de Produtos_
    `.trim();

    return message;
  }

  async sendTestMessage(phone: string, userId?: number): Promise<any> {
    const message = `
✅ *TESTE DE CONEXÃO*

Olá! Esta é uma mensagem de teste do Sistema de Análise de Produtos.

Se você recebeu esta mensagem, significa que a integração com WhatsApp está funcionando corretamente! 🎉

_Mensagem enviada BuscadorPXT_
    `.trim();

    return this.sendTextMessage({ phone, message }, userId, WhatsAppMessageType.TEXT);
  }

  private async createLog(data: Partial<WhatsAppLog>): Promise<WhatsAppLog> {
    const log = this.whatsappLogRepository.create(data);
    return await this.whatsappLogRepository.save(log);
  }

  private async updateLog(id: string, data: Partial<WhatsAppLog>): Promise<void> {
    await this.whatsappLogRepository.update(id, data);
  }

  async getLogsByUserId(userId: number, limit: number = 50): Promise<WhatsAppLog[]> {
    return await this.whatsappLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getLogsByStatus(status: WhatsAppLogStatus, limit: number = 50): Promise<WhatsAppLog[]> {
    return await this.whatsappLogRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async countLogsByStatus(status: WhatsAppLogStatus): Promise<number> {
    return await this.whatsappLogRepository.count({ where: { status } });
  }
}
