import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSystemSettingDto, UpdateZApiSettingsDto, UpdateMailjetSettingsDto } from './dto/system-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { MailjetService } from '../auth/services/mailjet.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, AdminGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly mailjetService: MailjetService,
  ) {}

  @Get()
  async findAll() {
    return await this.settingsService.findAll();
  }

  @Get('zapi')
  async getZApiSettings() {
    return await this.settingsService.getZApiSettings();
  }

  @Put('zapi')
  async updateZApiSettings(@Body() dto: UpdateZApiSettingsDto) {
    await this.settingsService.updateZApiSettings(
      dto.clientToken,
      dto.instanceId,
      dto.instanceToken,
      dto.baseUrl,
    );
    return { message: 'Configurações Z-API atualizadas com sucesso' };
  }

  @Get('mailjet')
  async getMailjetSettings() {
    return await this.mailjetService.getSettings();
  }

  @Put('mailjet')
  async updateMailjetSettings(@Body() dto: UpdateMailjetSettingsDto) {
    await this.mailjetService.updateSettings(
      dto.apiKey,
      dto.apiSecret,
      dto.senderEmail,
      dto.senderName,
    );
    return { message: 'Configurações Mailjet atualizadas com sucesso' };
  }

  @Post('mailjet/test')
  async testMailjet(@Body() body: { email: string }) {
    const sent = await this.mailjetService.sendEmail({
      to: body.email,
      subject: '✅ Teste de Conexão - BuscadorPXT',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Teste de Conexão com Mailjet</h2>
          <p>Se você recebeu este email, significa que a integração com o Mailjet está funcionando corretamente! 🎉</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Este é um email automático enviado pelo sistema BuscadorPXT.
          </p>
        </div>
      `,
      text: 'Teste de Conexão - Se você recebeu este email, a integração com Mailjet está funcionando!',
    });

    if (!sent) {
      throw new Error('Erro ao enviar email de teste');
    }

    return { message: 'Email de teste enviado com sucesso' };
  }

  @Get('templates')
  async getMessageTemplates() {
    return await this.settingsService.getMessageTemplates();
  }

  @Put('templates')
  async updateMessageTemplates(@Body() dto: { welcomeMessage: string }) {
    await this.settingsService.updateWelcomeMessageTemplate(dto.welcomeMessage);
    return { message: 'Templates atualizados com sucesso' };
  }

  @Get('r2')
  async getR2Settings() {
    return await this.settingsService.getR2Settings();
  }

  @Put('r2')
  async updateR2Settings(@Body() dto: {
    r2AccountId: string;
    r2AccessKeyId: string;
    r2SecretAccessKey: string;
    r2BucketName: string;
    r2PublicUrl?: string;
  }) {
    await this.settingsService.updateR2Settings(
      dto.r2AccountId,
      dto.r2AccessKeyId,
      dto.r2SecretAccessKey,
      dto.r2BucketName,
      dto.r2PublicUrl,
    );
    return { message: 'Configurações R2 atualizadas com sucesso' };
  }

  @Get(':key')
  async findByKey(@Param('key') key: string) {
    const value = await this.settingsService.findByKey(key);
    return { key, value };
  }

  @Put(':key')
  async update(@Param('key') key: string, @Body() updateDto: UpdateSystemSettingDto) {
    return await this.settingsService.update(key, updateDto);
  }

  @Delete(':key')
  async remove(@Param('key') key: string) {
    await this.settingsService.remove(key);
    return { message: 'Configuração removida com sucesso' };
  }
}
