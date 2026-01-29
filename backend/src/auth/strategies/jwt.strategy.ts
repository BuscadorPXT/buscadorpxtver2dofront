import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    const secret = process.env.JWT_SECRET || 'secretKey';
    console.log('🔑 JwtStrategy - JWT_SECRET:', secret);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('🔍 JWT Payload recebido:', payload);
    console.log('🔍 Buscando usuário com ID:', payload.sub);
    
    const user = await this.usersService.findById(payload.sub);
    console.log('🔍 Usuário encontrado:', user ? { id: user.id, email: user.email, isApproved: user.isApproved, isActive: user.isActive } : null);
    
    if (!user) {
      console.log('❌ Usuário não encontrado no banco de dados');
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (!user.isApproved) {
      console.log('❌ Usuário não aprovado');
      throw new UnauthorizedException('Usuário não aprovado');
    }

    if (!user.isActive) {
      console.log('❌ Usuário inativo');
      throw new UnauthorizedException('Usuário inativo');
    }

    console.log('✅ Usuário validado com sucesso:', { id: user.id, email: user.email, isAdmin: user.isAdmin });

    const { password, ...result } = user;
    return result;
  }
}
