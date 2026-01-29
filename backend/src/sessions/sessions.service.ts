import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { UserSession } from '../presence/entities/user-session.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SessionsService {
    private readonly logger = new Logger(SessionsService.name);

    constructor(
        @InjectRepository(UserSession)
        private sessionRepository: Repository<UserSession>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async createOrUpdateSession(
        userId: number,
        ipAddress: string,
        userAgent?: string,
    ): Promise<UserSession> {

        let session = await this.sessionRepository.findOne({
            where: { userId, ipAddress },
        });

        if (session) {

            session.lastActivityAt = new Date();
            if (userAgent) {
                session.userAgent = userAgent;
            }
            return await this.sessionRepository.save(session);
        }

        session = this.sessionRepository.create({
            userId,
            ipAddress,
            userAgent,
            lastActivityAt: new Date(),
        });

        return await this.sessionRepository.save(session);
    }

    async getActiveSessions(userId: number): Promise<UserSession[]> {
        this.logger.debug(`getActiveSessions - Buscando sessões para userId: ${userId} (tipo: ${typeof userId})`);
        const sessions = await this.sessionRepository.find({
            where: { userId },
            order: { lastActivityAt: 'DESC' },
        });
        this.logger.debug(`getActiveSessions - Encontradas ${sessions.length} sessões para userId ${userId}`);
        return sessions;
    }

    async countActiveSessions(userId: number): Promise<number> {
        const count = await this.sessionRepository.count({
            where: { userId },
        });
        this.logger.debug(`countActiveSessions - userId: ${userId}, count: ${count}`);
        return count;
    }

    async canLogin(userId: number, ipAddress: string): Promise<boolean> {
        this.logger.debug(`canLogin - userId: ${userId} (tipo: ${typeof userId}), IP: ${ipAddress}`);

        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['plan'],
        });

        if (!user) {
            this.logger.error(`canLogin - Usuário não encontrado para userId: ${userId}`);
            throw new Error('Usuário não encontrado');
        }

        this.logger.debug(`canLogin - Usuário encontrado: ${user.email}, isAdmin: ${user.isAdmin}, plano: ${user.plan?.name || 'sem plano'}`);

        if (user.isAdmin) {
            this.logger.debug(`canLogin - Usuário é admin, sem limite de dispositivos`);
            return true;
        }

        const maxIps = user.maxConcurrentIps ?? user.plan?.maxConcurrentIps ?? 1;
        this.logger.debug(`canLogin - maxIps permitidos: ${maxIps} (user override: ${user.maxConcurrentIps}, plan: ${user.plan?.maxConcurrentIps})`);

        const existingSession = await this.sessionRepository.findOne({
            where: { userId, ipAddress },
        });

        if (existingSession) {
            this.logger.debug(`canLogin - Sessão existente para este IP, permitindo login`);
            return true;
        }

        const activeCount = await this.countActiveSessions(userId);
        this.logger.debug(`canLogin - Sessões ativas: ${activeCount}/${maxIps}`);

        const canLogin = activeCount < maxIps;
        this.logger.debug(`canLogin - Pode fazer login: ${canLogin}`);
        return canLogin;
    }

    async checkIpLimit(userId: number, ipAddress: string): Promise<void> {
        const canLogin = await this.canLogin(userId, ipAddress);

        if (!canLogin) {
            const user = await this.userRepository.findOne({
                where: { id: userId },
                relations: ['plan'],
            });

            const maxIps = user?.maxConcurrentIps ?? user?.plan?.maxConcurrentIps ?? 1;
            const activeCount = await this.countActiveSessions(userId);

            throw new ForbiddenException(
                `Limite de dispositivos simultâneos atingido (${activeCount}/${maxIps}). ` +
                `Por favor, desconecte um dispositivo ou entre em contato com o suporte.`,
            );
        }
    }

    async removeSession(sessionId: string): Promise<void> {
        const result = await this.sessionRepository.delete(sessionId);

        if (result.affected === 0) {
            throw new Error('Sessão não encontrada');
        }

        console.log(`Sessão removida: ${sessionId}`);
    }

    async removeSessionByIp(userId: number, ipAddress: string): Promise<void> {
        const result = await this.sessionRepository.delete({ userId, ipAddress });

        if (result.affected === 0) {
            throw new Error('Sessão não encontrada');
        }

        console.log(`Sessão removida: userId=${userId}, ip=${ipAddress}`);
    }

    async removeAllSessions(userId: number): Promise<void> {
        const result = await this.sessionRepository.delete({ userId });
        console.log(`${result.affected || 0} sessões removidas do usuário ${userId}`);
    }

    async updateActivity(userId: number, ipAddress: string): Promise<void> {
        await this.sessionRepository.update(
            { userId, ipAddress },
            { lastActivityAt: new Date() },
        );
    }

    @Cron('0 * * * *')
    async cleanInactiveSessions(): Promise<void> {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const result = await this.sessionRepository.delete({
            lastActivityAt: LessThan(twentyFourHoursAgo),
        });

        if (result.affected && result.affected > 0) {
            console.log(`🧹 Limpeza automática: ${result.affected} sessões inativas removidas`);
        }
    }

    async getStats(): Promise<{
        totalSessions: number;
        uniqueUsers: number;
        uniqueIps: number;
    }> {
        const sessions = await this.sessionRepository.find();

        return {
            totalSessions: sessions.length,
            uniqueUsers: new Set(sessions.map(s => s.userId)).size,
            uniqueIps: new Set(sessions.map(s => s.ipAddress)).size,
        };
    }
}
