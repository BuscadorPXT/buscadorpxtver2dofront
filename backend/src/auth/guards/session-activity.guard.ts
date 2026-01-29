import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionsService } from '../../sessions/sessions.service';

@Injectable()
export class SessionActivityGuard implements CanActivate {
    constructor(
        private sessionsService: SessionsService,
        private reflector: Reflector,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.id) {
            return true;
        }

        const ipAddress = request.headers['x-forwarded-for']?.split(',')[0]?.trim()
            || request.headers['x-real-ip']
            || request.connection.remoteAddress
            || request.ip
            || 'unknown';

        try {
            await this.sessionsService.updateActivity(user.id, ipAddress);
        } catch (error) {

            console.error('⚠️  Erro ao atualizar atividade da sessão:', error.message);
        }

        return true;
    }
}
