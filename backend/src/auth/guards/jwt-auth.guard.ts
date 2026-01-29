import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    console.log('🔐 JwtAuthGuard - Authorization Header:', authHeader);
    
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('🔐 JwtAuthGuard - handleRequest chamado');
    console.log('  - Erro:', err);
    console.log('  - User:', user);
    console.log('  - Info:', info);
    
    if (err || !user) {
      throw err || new UnauthorizedException('Token inválido ou ausente');
    }
    return user;
  }
}
