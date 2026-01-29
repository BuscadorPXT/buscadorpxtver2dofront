import {
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Param,
    ParseIntPipe,
    Request,
    UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
    constructor(private sessionsService: SessionsService) { }

    @Get('me')
    async getMySessions(@Request() req) {
        const sessions = await this.sessionsService.getActiveSessions(req.user.id);

        return {
            sessions: sessions.map(s => ({
                id: s.id,
                ipAddress: s.ipAddress,
                userAgent: s.userAgent,
                lastActivityAt: s.lastActivityAt,
                createdAt: s.createdAt,
            })),
            count: sessions.length,
        };
    }

    @Delete('me/:sessionId')
    async removeMySession(@Request() req, @Param('sessionId') sessionId: string) {

        const sessions = await this.sessionsService.getActiveSessions(req.user.id);
        const session = sessions.find(s => s.id.toString() === sessionId);

        if (!session) {
            throw new ForbiddenException('Sessão não encontrada ou não pertence a você');
        }

        await this.sessionsService.removeSession(sessionId);

        return {
            message: 'Sessão removida com sucesso',
            sessionId,
        };
    }

    @Get('user/:userId')
    @UseGuards(AdminGuard)
    async getUserSessions(@Param('userId', ParseIntPipe) userId: number) {
        const sessions = await this.sessionsService.getActiveSessions(userId);

        return {
            userId,
            sessions: sessions.map(s => ({
                id: s.id,
                ipAddress: s.ipAddress,
                userAgent: s.userAgent,
                lastActivityAt: s.lastActivityAt,
                createdAt: s.createdAt,
            })),
            count: sessions.length,
        };
    }

    @Delete('user/:userId/:sessionId')
    @UseGuards(AdminGuard)
    async removeUserSession(
        @Param('userId', ParseIntPipe) userId: number,
        @Param('sessionId') sessionId: string,
    ) {
        await this.sessionsService.removeSession(sessionId);

        return {
            message: 'Sessão removida com sucesso',
            userId,
            sessionId,
        };
    }

    @Delete('user/:userId')
    @UseGuards(AdminGuard)
    async removeAllUserSessions(@Param('userId', ParseIntPipe) userId: number) {
        await this.sessionsService.removeAllSessions(userId);

        return {
            message: 'Todas as sessões do usuário foram removidas',
            userId,
        };
    }

    @Get('stats')
    @UseGuards(AdminGuard)
    async getStats() {
        return await this.sessionsService.getStats();
    }
}
