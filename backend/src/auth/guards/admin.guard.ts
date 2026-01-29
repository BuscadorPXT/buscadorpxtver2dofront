import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log('user no AdminGuard:', user);
    if (!user || !user.isAdmin) {
      throw new ForbiddenException('Acesso negado. Apenas administradores podem acessar este recurso.');
    }

    return true;
  }
}
