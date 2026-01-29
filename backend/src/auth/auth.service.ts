import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { SettingsService } from '../settings/settings.service';
import { AuthResponseDto, RegisterDto } from './dto/auth.dto';
import { MailjetService } from './services/mailjet.service';
import { ZApiService } from '../notifications/zapi.service';
import { WhatsAppMessageType } from '../notifications/entities/whatsapp-log.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private sessionsService: SessionsService,
    private mailjetService: MailjetService,
    private zapiService: ZApiService,
    private settingsService: SettingsService,
  ) { }

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    this.logger.log(`[REGISTER] Iniciando cadastro para email: ${registerDto.email}`);
    
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    this.logger.log(`[REGISTER] Usuário criado com sucesso: ID=${newUser.id}, Email=${newUser.email}`);

    this.sendWelcomeNotifications(newUser, registerDto);

    return { message: 'Usuário registrado com sucesso. Aguarde aprovação do administrador.' };
  }

  private async sendWelcomeNotifications(user: any, registerDto: RegisterDto): Promise<void> {
    const firstName = registerDto.name?.split(' ')[0] || '';

    if (registerDto.phone) {
      this.sendWhatsAppWelcome(user, registerDto, firstName).catch(error => {
        this.logger.error(`[REGISTER] Erro ao enviar WhatsApp de boas-vindas: ${error.message}`);
      });
    } else {
      this.logger.warn(`[REGISTER] Usuário cadastrado sem telefone, WhatsApp não enviado`);
    }

    this.sendEmailWelcome(user, registerDto, firstName).catch(error => {
      this.logger.error(`[REGISTER] Erro ao enviar Email de boas-vindas: ${error.message}`);
    });
  }

  private async sendWhatsAppWelcome(user: any, registerDto: RegisterDto, firstName: string): Promise<void> {
    this.logger.log(`[REGISTER] Enviando WhatsApp de boas-vindas para: ${registerDto.phone}`);
    
    const template = await this.settingsService.getWelcomeMessageTemplate();
    const welcomeMessage = template
      .replace(/\[e-mail\]/g, registerDto.email)
      .replace(/\[primeiro-nome\]/g, firstName)
      .replace(/\[nome-completo\]/g, registerDto.name || '');
    
    await this.zapiService.sendTextMessage(
      {
        phone: registerDto.phone!,
        message: welcomeMessage,
        userId: user.id?.toString(),
        messageType: WhatsAppMessageType.WELCOME_REGISTRATION,
      },
      user.id,
      WhatsAppMessageType.WELCOME_REGISTRATION,
    );
    
    this.logger.log(`[REGISTER] WhatsApp de boas-vindas enviado com sucesso para: ${registerDto.phone}`);
  }

  private async sendEmailWelcome(user: any, registerDto: RegisterDto, firstName: string): Promise<void> {
    this.logger.log(`[REGISTER] Enviando Email de boas-vindas para: ${registerDto.email}`);
    
    const subject = 'Bem-vindo ao BuscadorPXT!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Bem-vindo ao BuscadorPXT!</h2>
        <p>Olá <strong>${firstName || registerDto.name}</strong>,</p>
        <p>Seu cadastro foi realizado com sucesso!</p>
        <p>Aguarde a aprovação do administrador para acessar o sistema.</p>
        <p>Você receberá uma notificação assim que sua conta for aprovada.</p>
        <br>
        <p style="color: #666;">Atenciosamente,<br>Equipe BuscadorPXT</p>
      </div>
    `;
    
    await this.mailjetService.sendEmail({
      to: registerDto.email,
      subject,
      html,
    });
    
    this.logger.log(`[REGISTER] Email de boas-vindas enviado com sucesso para: ${registerDto.email}`);
  }

  async validateUser(email: string, password: string): Promise<any> {
    console.log('🔍 validateUser - email:', email);
    const user = await this.usersService.findByEmail(email);
    console.log('🔍 validateUser - user encontrado:', user ? 'SIM' : 'NÃO');

    if (!user) {
      console.log('❌ validateUser - Usuário não encontrado');
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('🔍 validateUser - senha match:', passwordMatch);

    if (passwordMatch) {
      if (!user.isApproved) {
        console.log('❌ validateUser - Usuário não aprovado');
        throw new UnauthorizedException('Usuário ainda não foi aprovado pelo administrador');
      }
      console.log('✅ validateUser - Usuário validado com sucesso');
      const { password, ...result } = user;
      return result;
    }

    console.log('❌ validateUser - Senha incorreta');
    return null;
  }

  async login(user: any, ipAddress: string, userAgent: string): Promise<AuthResponseDto> {
    console.log('🔑 AuthService.login - User:', user.id, 'IP:', ipAddress);

    const payload = {
      email: user.email,
      sub: user.id,
      isAdmin: user.isAdmin,
      name: user.name,
    };
    console.log('🔑 AuthService.login - JWT_SECRET usado:', process.env.JWT_SECRET || 'secretKey');
    console.log('🔑 AuthService.login - Payload:', payload);
    const token = this.jwtService.sign(payload);
    console.log('🔑 AuthService.login - Token gerado:', token);

    const session = await this.sessionsService.createOrUpdateSession(user.id, ipAddress, userAgent);
    console.log('✅ AuthService.login - Session created/updated:', session.id);

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isApproved: user.isApproved,
        isAdmin: user.isAdmin,
        plan: user.plan ? {
          id: user.plan.id,
          name: user.plan.name,
          disableSupplierContact: user.plan.disableSupplierContact,
          hideSupplier: user.plan.hideSupplier,
        } : null,
      },
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    console.log(`[FORGOT_PASSWORD] Iniciando processo de recuperação de senha para: ${email}`);
    
    const user = await this.usersService.findByEmail(email);
    console.log(`[FORGOT_PASSWORD] Busca de usuário concluída. Encontrado: ${user ? 'SIM' : 'NÃO'}`);

    if (!user) {
      this.logger.warn(`[FORGOT_PASSWORD] Tentativa de recuperação de senha para email inexistente: ${email}`);
      return { message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.' };
    }

    console.log(`[FORGOT_PASSWORD] Usuário encontrado: ID=${user.id}, Nome=${user.name}`);

    console.log(`[FORGOT_PASSWORD] Gerando token de reset para usuário ID=${user.id}...`);
    const resetToken = await this.usersService.createPasswordResetToken(user.id);
    console.log(`[FORGOT_PASSWORD] Token gerado com sucesso: ${resetToken.substring(0, 10)}...`);

    console.log(`[FORGOT_PASSWORD] Iniciando envio de email via Mailjet para: ${email}`);
    const emailSent = await this.mailjetService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken
    );
    console.log(`[FORGOT_PASSWORD] Resultado do envio de email: ${emailSent ? 'SUCESSO' : 'FALHA'}`);

    if (!emailSent) {
      this.logger.error(`[FORGOT_PASSWORD] ERRO ao enviar email de recuperação para: ${email}`);
      throw new BadRequestException('Erro ao enviar email de recuperação. Tente novamente mais tarde.');
    }

    console.log(`[FORGOT_PASSWORD] Processo concluído com sucesso para: ${email}`);
    return { message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.' };
  }

  async validateResetToken(token: string): Promise<{ valid: boolean; email?: string }> {
    const user = await this.usersService.findByResetToken(token);
    
    if (!user) {
      return { valid: false };
    }

    const emailParts = user.email.split('@');
    const maskedEmail = `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`;

    return { valid: true, email: maskedEmail };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.usersService.findByResetToken(token);
    
    if (!user) {
      throw new BadRequestException('Token inválido ou expirado. Solicite um novo link de recuperação.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.updatePassword(user.id, hashedPassword);
    
    console.log(`Senha redefinida com sucesso para: ${user.email}`);
    return { message: 'Senha redefinida com sucesso! Você já pode fazer login com sua nova senha.' };
  }
}
