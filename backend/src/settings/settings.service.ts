import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSettings } from './entities/system-settings.entity';
import { CreateSystemSettingDto, UpdateSystemSettingDto } from './dto/system-settings.dto';
import * as crypto from 'crypto';

@Injectable()
export class SettingsService {
  private readonly encryptionKey: string;

  constructor(
    @InjectRepository(SystemSettings)
    private settingsRepository: Repository<SystemSettings>,
  ) {
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-this';
  }

  async findAll(): Promise<SystemSettings[]> {
    const settings = await this.settingsRepository.find();

    return settings.map(setting => ({
      ...setting,
      value: setting.isEncrypted && setting.value ? this.decrypt(setting.value) : setting.value,
    }));
  }

  async findByKey(key: string): Promise<string | null> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting || !setting.value) {
      return null;
    }
    return setting.isEncrypted ? this.decrypt(setting.value) : setting.value;
  }

  async upsert(key: string, value: string, description?: string, isEncrypted: boolean = false): Promise<SystemSettings> {
    const existing = await this.settingsRepository.findOne({ where: { key } });
    
    const encryptedValue = isEncrypted ? this.encrypt(value) : value;

    if (existing) {
      existing.value = encryptedValue;
      if (description) existing.description = description;
      existing.isEncrypted = isEncrypted;
      return await this.settingsRepository.save(existing);
    }

    const newSetting = this.settingsRepository.create({
      key,
      value: encryptedValue,
      description,
      isEncrypted,
    });

    return await this.settingsRepository.save(newSetting);
  }

  async update(key: string, updateDto: UpdateSystemSettingDto): Promise<SystemSettings> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    
    if (!setting) {
      throw new NotFoundException(`Configuração ${key} não encontrada`);
    }

    if (updateDto.value !== undefined) {
      setting.value = setting.isEncrypted ? this.encrypt(updateDto.value) : updateDto.value;
    }
    
    if (updateDto.description !== undefined) {
      setting.description = updateDto.description;
    }

    return await this.settingsRepository.save(setting);
  }

  async remove(key: string): Promise<void> {
    const setting = await this.settingsRepository.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Configuração ${key} não encontrada`);
    }
    await this.settingsRepository.remove(setting);
  }

  async getZApiSettings(): Promise<{
    clientToken: string;
    instanceId: string;
    instanceToken: string;
    baseUrl: string;
  }> {
    const clientToken = await this.findByKey('ZAPI_CLIENT_TOKEN') || process.env.ZAPI_CLIENT_TOKEN || '';
    const instanceId = await this.findByKey('ZAPI_INSTANCE_ID') || process.env.ZAPI_INSTANCE_ID || '';
    const instanceToken = await this.findByKey('ZAPI_INSTANCE_TOKEN') || process.env.ZAPI_INSTANCE_TOKEN || '';
    const baseUrl = await this.findByKey('ZAPI_BASE_URL') || process.env.ZAPI_BASE_URL || 'https://api.z-api.io';

    return { clientToken, instanceId, instanceToken, baseUrl };
  }

  async updateZApiSettings(clientToken: string, instanceId: string, instanceToken: string, baseUrl?: string): Promise<void> {
    await this.upsert('ZAPI_CLIENT_TOKEN', clientToken, 'Token do Cliente Z-API', true);
    await this.upsert('ZAPI_INSTANCE_ID', instanceId, 'ID da Instância Z-API', false);
    await this.upsert('ZAPI_INSTANCE_TOKEN', instanceToken, 'Token da Instância Z-API', true);
    if (baseUrl) {
      await this.upsert('ZAPI_BASE_URL', baseUrl, 'URL base da API Z-API', false);
    }
  }

  async getWelcomeMessageTemplate(): Promise<string> {
    const template = await this.findByKey('WELCOME_MESSAGE_TEMPLATE');

    return template || 'Olá [primeiro-nome], tudo bem? Verifiquei aqui que você realizou um cadastro em nosso sistema, correto? O e-mail utilizado foi: [e-mail]';
  }

  async updateWelcomeMessageTemplate(template: string): Promise<void> {
    await this.upsert('WELCOME_MESSAGE_TEMPLATE', template, 'Template da mensagem de boas-vindas enviada no WhatsApp após cadastro', false);
  }

  async getMessageTemplates(): Promise<{
    welcomeMessage: string;
  }> {
    const welcomeMessage = await this.getWelcomeMessageTemplate();
    return { welcomeMessage };
  }

  async getR2Settings(): Promise<{
    r2AccountId: string;
    r2AccessKeyId: string;
    r2SecretAccessKey: string;
    r2BucketName: string;
    r2PublicUrl: string;
  }> {
    const settings = await this.settingsRepository.findOne({ 
      where: [{ id: 1 }, { key: 'system' }] 
    });
    
    return {
      r2AccountId: settings?.r2AccountId || '',
      r2AccessKeyId: settings?.r2AccessKeyId || '',
      r2SecretAccessKey: settings?.r2SecretAccessKey || '',
      r2BucketName: settings?.r2BucketName || '',
      r2PublicUrl: settings?.r2PublicUrl || '',
    };
  }

  async updateR2Settings(
    r2AccountId: string,
    r2AccessKeyId: string,
    r2SecretAccessKey: string,
    r2BucketName: string,
    r2PublicUrl?: string,
  ): Promise<void> {
    let settings = await this.settingsRepository.findOne({ 
      where: [{ id: 1 }, { key: 'system' }] 
    });
    
    if (!settings) {
      settings = this.settingsRepository.create({
        key: 'system',
        value: 'system',
      });
    }

    settings.r2AccountId = r2AccountId;
    settings.r2AccessKeyId = r2AccessKeyId;
    settings.r2SecretAccessKey = r2SecretAccessKey;
    settings.r2BucketName = r2BucketName;
    settings.r2PublicUrl = r2PublicUrl || '';

    await this.settingsRepository.save(settings);
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string): string {
    try {
      const parts = text.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      return text;
    }
  }
}
