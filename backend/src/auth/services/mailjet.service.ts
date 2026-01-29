import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Mailjet from 'node-mailjet';
import { SettingsService } from '../../settings/settings.service';

export interface SendEmailDto {
  to: string;
  toName?: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class MailjetService {
  private readonly logger = new Logger(MailjetService.name);
  private mailjet: Mailjet;

  constructor(
    private configService: ConfigService,
    private settingsService: SettingsService,
  ) {
    this.initializeMailjet();
  }

  private async initializeMailjet(): Promise<void> {
    try {
      console.log('[MAILJET_INIT] Iniciando inicialização do Mailjet...');
      
      const apiKeyFromSettings = await this.settingsService.findByKey('MAILJET_API_KEY');
      const apiKeyFromEnv = this.configService.get('MAILJET_API_KEY');
      const apiSecretFromSettings = await this.settingsService.findByKey('MAILJET_API_SECRET');
      const apiSecretFromEnv = this.configService.get('MAILJET_API_SECRET');
      
      console.log(`[MAILJET_INIT] API Key from Settings: ${apiKeyFromSettings ? 'PRESENTE' : 'AUSENTE'}`);
      console.log(`[MAILJET_INIT] API Key from ENV: ${apiKeyFromEnv ? 'PRESENTE' : 'AUSENTE'}`);
      console.log(`[MAILJET_INIT] API Secret from Settings: ${apiSecretFromSettings ? 'PRESENTE' : 'AUSENTE'}`);
      console.log(`[MAILJET_INIT] API Secret from ENV: ${apiSecretFromEnv ? 'PRESENTE' : 'AUSENTE'}`);
      
      const apiKey = apiKeyFromSettings || apiKeyFromEnv;
      const apiSecret = apiSecretFromSettings || apiSecretFromEnv;

      if (apiKey && apiSecret) {
        console.log(`[MAILJET_INIT] Credenciais encontradas. API Key começa com: ${apiKey.substring(0, 4)}...`);
        this.mailjet = new Mailjet({
          apiKey,
          apiSecret,
        });
        console.log('[MAILJET_INIT] Mailjet inicializado com sucesso');
      } else {
        this.logger.warn('[MAILJET_INIT] Credenciais do Mailjet não configuradas');
      }
    } catch (error) {
      this.logger.error('[MAILJET_INIT] Erro ao inicializar Mailjet:', error);
    }
  }

  private async getMailjetClient(): Promise<Mailjet> {
    console.log(`[MAILJET_CLIENT] Obtendo cliente Mailjet. Cliente existente: ${this.mailjet ? 'SIM' : 'NÃO'}`);
    
    if (!this.mailjet) {
      console.log('[MAILJET_CLIENT] Cliente não existe, inicializando...');
      await this.initializeMailjet();
    }
    
    if (!this.mailjet) {
      this.logger.error('[MAILJET_CLIENT] ERRO: Mailjet não foi inicializado após tentativa');
      throw new Error('Mailjet não está configurado. Configure as credenciais MAILJET_API_KEY e MAILJET_API_SECRET.');
    }
    
    console.log('[MAILJET_CLIENT] Cliente Mailjet obtido com sucesso');
    return this.mailjet;
  }

  async sendEmail(dto: SendEmailDto): Promise<boolean> {
    console.log(`[SEND_EMAIL] Iniciando envio de email para: ${dto.to}`);
    console.log(`[SEND_EMAIL] Assunto: ${dto.subject}`);
    
    try {
      console.log('[SEND_EMAIL] Obtendo cliente Mailjet...');
      const client = await this.getMailjetClient();
      console.log('[SEND_EMAIL] Cliente obtido com sucesso');
      
      const senderEmailFromSettings = await this.settingsService.findByKey('MAILJET_SENDER_EMAIL');
      const senderEmailFromEnv = this.configService.get('MAILJET_SENDER_EMAIL');
      const senderEmail = senderEmailFromSettings || senderEmailFromEnv || 'noreply@buscadorpxt.com.br';
      
      const senderNameFromSettings = await this.settingsService.findByKey('MAILJET_SENDER_NAME');
      const senderNameFromEnv = this.configService.get('MAILJET_SENDER_NAME');
      const senderName = senderNameFromSettings || senderNameFromEnv || 'BuscadorPXT';

      console.log(`[SEND_EMAIL] ========== CONFIGURAÇÃO DO EMAIL ==========`);
      console.log(`[SEND_EMAIL] Sender Email from Settings: ${senderEmailFromSettings || 'NÃO DEFINIDO'}`);
      console.log(`[SEND_EMAIL] Sender Email from ENV: ${senderEmailFromEnv || 'NÃO DEFINIDO'}`);
      console.log(`[SEND_EMAIL] Sender Email FINAL: ${senderEmail}`);
      console.log(`[SEND_EMAIL] Sender Name FINAL: ${senderName}`);
      console.log(`[SEND_EMAIL] Remetente: ${senderName} <${senderEmail}>`);
      console.log(`[SEND_EMAIL] Destinatário: ${dto.toName || dto.to} <${dto.to}>`);
      console.log(`[SEND_EMAIL] Assunto: ${dto.subject}`);
      console.log(`[SEND_EMAIL] ===========================================`);
      
      const messagePayload = {
        Messages: [
          {
            From: {
              Email: senderEmail,
              Name: senderName,
            },
            To: [
              {
                Email: dto.to,
                Name: dto.toName || dto.to,
              },
            ],
            Subject: dto.subject,
            TextPart: dto.text,
            HTMLPart: dto.html,
          },
        ],
      };

      console.log('[SEND_EMAIL] Enviando requisição para Mailjet API v3.1...');
      const request = client.post('send', { version: 'v3.1' }).request(messagePayload);

      const result = await request;
      const responseBody = result.body as any;
      
      console.log(`[SEND_EMAIL] ========== RESPOSTA MAILJET ==========`);
      console.log(`[SEND_EMAIL] Status HTTP: ${result.response?.status || 'N/A'}`);
      console.log(`[SEND_EMAIL] Response completo: ${JSON.stringify(responseBody, null, 2)}`);

      if (responseBody?.Messages && Array.isArray(responseBody.Messages)) {
        responseBody.Messages.forEach((msg: any, index: number) => {
          console.log(`[SEND_EMAIL] Mensagem ${index + 1}:`);
          console.log(`[SEND_EMAIL]   - Status: ${msg.Status}`);
          console.log(`[SEND_EMAIL]   - CustomID: ${msg.CustomID || 'N/A'}`);
          
          if (msg.To && Array.isArray(msg.To)) {
            msg.To.forEach((recipient: any) => {
              console.log(`[SEND_EMAIL]   - To Email: ${recipient.Email}`);
              console.log(`[SEND_EMAIL]   - To MessageUUID: ${recipient.MessageUUID}`);
              console.log(`[SEND_EMAIL]   - To MessageID: ${recipient.MessageID}`);
              console.log(`[SEND_EMAIL]   - To MessageHref: ${recipient.MessageHref}`);
            });
          }
          
          if (msg.Errors && Array.isArray(msg.Errors)) {
            msg.Errors.forEach((err: any) => {
              this.logger.error(`[SEND_EMAIL]   - ERRO: ${err.ErrorIdentifier} - ${err.ErrorCode} - ${err.ErrorMessage}`);
            });
          }
        });
      }
      console.log(`[SEND_EMAIL] =======================================`);
      
      console.log(`[SEND_EMAIL] Email enviado com sucesso para ${dto.to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`[SEND_EMAIL] ERRO ao enviar email para ${dto.to}`);
      this.logger.error(`[SEND_EMAIL] Tipo do erro: ${error?.constructor?.name}`);
      this.logger.error(`[SEND_EMAIL] Mensagem: ${error?.message}`);
      this.logger.error(`[SEND_EMAIL] Status Code: ${error?.statusCode || error?.response?.status || 'N/A'}`);
      this.logger.error(`[SEND_EMAIL] Response Body:`, error?.response?.body || error?.body || 'N/A');
      this.logger.error(`[SEND_EMAIL] Stack:`, error?.stack);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
    console.log(`[PASSWORD_RESET_EMAIL] Iniciando preparação do email de reset de senha`);
    console.log(`[PASSWORD_RESET_EMAIL] Email: ${email}, Nome: ${name}`);
    console.log(`[PASSWORD_RESET_EMAIL] Token (primeiros 10 chars): ${resetToken.substring(0, 10)}...`);
    
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'https://buscadorpxt.com.br';
    console.log(`[PASSWORD_RESET_EMAIL] Frontend URL: ${frontendUrl}`);
    
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    console.log(`[PASSWORD_RESET_EMAIL] Reset Link: ${resetLink}`);
    
    const firstName = name.split(' ')[0];
    console.log(`[PASSWORD_RESET_EMAIL] Primeiro nome: ${firstName}`);

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Redefinir Senha</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto;">
          
          <!-- Logo/Brand -->
          <tr>
            <td style="text-align: center; padding-bottom: 32px;">
              <span style="font-size: 28px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px;">BuscadorPXT</span>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                
                <!-- Card Content -->
                <tr>
                  <td style="padding: 48px 40px;">
                    
                    <!-- Title -->
                    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #0f172a; text-align: center; letter-spacing: -0.3px;">
                      Redefinir senha
                    </h1>
                    
                    <!-- Subtitle -->
                    <p style="margin: 0 0 32px 0; font-size: 15px; color: #64748b; text-align: center; line-height: 1.5;">
                      Olá ${firstName}, recebemos uma solicitação para redefinir a senha da sua conta.
                    </p>
                    
                    <!-- Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center; padding-bottom: 32px;">
                          <a href="${resetLink}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 500; letter-spacing: 0.2px;">
                            Criar nova senha
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Divider -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
                          <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8; text-align: center;">
                            Ou copie este link:
                          </p>
                          <p style="margin: 0; font-size: 12px; color: #3b82f6; text-align: center; word-break: break-all; line-height: 1.6;">
                            ${resetLink}
                          </p>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
          
          <!-- Info Box -->
          <tr>
            <td style="padding-top: 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fefce8; border-radius: 12px; border: 1px solid #fef08a;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          <p style="margin: 0; font-size: 13px; color: #854d0e; line-height: 1.5;">
                            Este link expira em <strong>1 hora</strong>. Se você não solicitou esta alteração, ignore este email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding-top: 40px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} BuscadorPXT
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                Este é um email automático, por favor não responda.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Redefinir Senha - BuscadorPXT

Olá ${firstName},

Recebemos uma solicitação para redefinir a senha da sua conta.

Para criar uma nova senha, acesse o link abaixo:
${resetLink}

⏱️ Este link expira em 1 hora.

Se você não solicitou esta alteração, ignore este email.

---
© ${new Date().getFullYear()} BuscadorPXT
Este é um email automático, por favor não responda.
    `.trim();

    console.log(`[PASSWORD_RESET_EMAIL] Templates HTML e texto preparados`);
    console.log(`[PASSWORD_RESET_EMAIL] Chamando sendEmail...`);

    const result = await this.sendEmail({
      to: email,
      toName: name,
      subject: 'Redefinir sua senha - BuscadorPXT',
      html,
      text,
    });

    console.log(`[PASSWORD_RESET_EMAIL] Resultado do sendEmail: ${result ? 'SUCESSO' : 'FALHA'}`);
    return result;
  }

  async updateSettings(apiKey: string, apiSecret: string, senderEmail?: string, senderName?: string): Promise<void> {
    await this.settingsService.upsert('MAILJET_API_KEY', apiKey, 'API Key do Mailjet', true);
    await this.settingsService.upsert('MAILJET_API_SECRET', apiSecret, 'API Secret do Mailjet', true);
    
    if (senderEmail) {
      await this.settingsService.upsert('MAILJET_SENDER_EMAIL', senderEmail, 'Email do remetente', false);
    }
    
    if (senderName) {
      await this.settingsService.upsert('MAILJET_SENDER_NAME', senderName, 'Nome do remetente', false);
    }

    await this.initializeMailjet();
  }

  async getSettings(): Promise<{
    apiKey: string;
    apiSecret: string;
    senderEmail: string;
    senderName: string;
  }> {
    return {
      apiKey: await this.settingsService.findByKey('MAILJET_API_KEY') || '',
      apiSecret: await this.settingsService.findByKey('MAILJET_API_SECRET') || '',
      senderEmail: await this.settingsService.findByKey('MAILJET_SENDER_EMAIL') || '',
      senderName: await this.settingsService.findByKey('MAILJET_SENDER_NAME') || '',
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.getMailjetClient();

      await client.get('contact', { version: 'v3' }).request({ Limit: 1 });
      return true;
    } catch (error) {
      this.logger.error('Erro ao testar conexão com Mailjet:', error);
      return false;
    }
  }
}
