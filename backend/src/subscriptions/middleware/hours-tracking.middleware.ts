import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../entities/subscription.entity';

interface JwtUser {
  id: number;
  email: string;
  isAdmin: boolean;
}

@Injectable()
export class HoursTrackingMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {

      const user = req['user'] as JwtUser;
      
      console.log('[HoursTracking] Middleware executado');
      console.log('[HoursTracking] User:', user);
      
      if (!user) {
        console.log('[HoursTracking] Nenhum usuário encontrado, pulando');
        return next();
      }

      if (user.isAdmin) {
        console.log('[HoursTracking] Usuário é admin, pulando controle de horas');
        return next();
      }

      const userId = String(user.id);
      console.log('[HoursTracking] UserId:', userId);

      const subscription = await this.subscriptionsRepository.findOne({
        where: { userId },
      });

      if (!subscription) {
        throw new UnauthorizedException('Você precisa de uma assinatura para acessar este recurso');
      }

      if (!subscription.isActive) {
        throw new UnauthorizedException('Sua assinatura está inativa');
      }

      const now = new Date();

      if (!subscription.lastAccessAt) {
        console.log(`[HoursTracking] Primeiro acesso do usuário ${userId}, inicializando lastAccessAt`);
        subscription.lastAccessAt = now;
        await this.subscriptionsRepository.save(subscription);
        return next();
      }

      const millisecondsElapsed = now.getTime() - new Date(subscription.lastAccessAt).getTime();
      const hoursElapsed = millisecondsElapsed / (1000 * 60 * 60);

      console.log(`[HoursTracking] Usuário ${userId}: ${hoursElapsed.toFixed(4)}h decorridas, ${subscription.hoursUsed}h usadas, ${subscription.hoursAvailable}h disponíveis`);

      if (hoursElapsed >= 1 / 60) {
        console.log(`[HoursTracking] Atualizando horas do usuário ${userId}: +${hoursElapsed.toFixed(4)}h`);

        subscription.hoursUsed = Number(subscription.hoursUsed) + hoursElapsed;
        subscription.lastAccessAt = now;

        const remainingHours = Number(subscription.hoursAvailable) - Number(subscription.hoursUsed);

        if (remainingHours <= 0) {
          subscription.isActive = false;
          await this.subscriptionsRepository.save(subscription);
          throw new UnauthorizedException('Suas horas acabaram. Por favor, renove seu plano para continuar.');
        }

        await this.subscriptionsRepository.save(subscription);
      }

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      next();
    }
  }
}
