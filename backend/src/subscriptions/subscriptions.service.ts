import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
  PaymentMethod,
  RenewalRecord,
} from './entities/subscription.entity';
import { PlansService } from '../plans/plans.service';
import { User } from '../users/entities/user.entity';
import { PresenceGateway } from '../presence/presence.gateway';

export interface RenewSubscriptionDto {
  amount: number;
  paymentMethod: PaymentMethod;
  duration: number;
  startDate?: string;
  endDate?: string;
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus;
  expiringInDays?: number;
  isActive?: boolean;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => PlansService))
    private plansService: PlansService,
    @Inject(forwardRef(() => PresenceGateway))
    private presenceGateway: PresenceGateway,
  ) {}

  async findAll(filters?: SubscriptionFilters): Promise<Subscription[]> {

    const query = this.subscriptionsRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.user', 'user')
      .distinctOn(['subscription.userId'])
      .orderBy('subscription.userId', 'ASC')
      .addOrderBy('subscription.createdAt', 'DESC');

    if (filters) {
      if (filters.status) {
        query.andWhere('subscription.status = :status', { status: filters.status });
      }

      if (filters.isActive !== undefined) {
        query.andWhere('subscription.isActive = :isActive', { isActive: filters.isActive });
      }

      if (filters.expiringInDays !== undefined) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + filters.expiringInDays);

        query.andWhere('subscription.endDate BETWEEN :now AND :futureDate', {
          now,
          futureDate,
        });
        query.andWhere('subscription.status != :expired', { expired: SubscriptionStatus.EXPIRED });
      }
    }

    const results = await query.getMany();

    return results.sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async findByUserId(userId: string): Promise<Subscription | null> {

    const activeSubscription = await this.subscriptionsRepository.findOne({
      where: { 
        userId,
        isActive: true,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['user'],
      order: { endDate: 'DESC' },
    });

    if (activeSubscription) {
      return activeSubscription;
    }

    return this.subscriptionsRepository.findOne({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async renewSubscription(
    id: string,
    renewDto: RenewSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.findOne(id);

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    if (renewDto.duration <= 0) {
      throw new BadRequestException('Duration must be greater than 0');
    }

    if (renewDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    const previousEndDate = new Date(subscription.endDate);
    const now = new Date();
    
    let startDate: Date;
    let newEndDate: Date;

    if (renewDto.startDate && renewDto.endDate) {
      startDate = new Date(renewDto.startDate);
      newEndDate = new Date(renewDto.endDate);
    } else {

      if (previousEndDate > now) {
        startDate = previousEndDate;
      } else {
        startDate = now;
      }
      newEndDate = this.calculateNextEndDate(startDate, renewDto.duration);
    }

    const renewalRecord: RenewalRecord = {
      date: new Date(),
      amount: renewDto.amount,
      paymentMethod: renewDto.paymentMethod,
      duration: renewDto.duration,
      previousEndDate,
      newEndDate,
    };

    subscription.renewalHistory = [...subscription.renewalHistory, renewalRecord];
    subscription.endDate = newEndDate;
    subscription.amount = renewDto.amount;
    subscription.paymentMethod = renewDto.paymentMethod;
    subscription.isActive = true;
    subscription.status = SubscriptionStatus.ACTIVE;

    return this.subscriptionsRepository.save(subscription);
  }

  calculateNextEndDate(startDate: Date, durationInDays: number): Date {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationInDays);
    return endDate;
  }

  async getExpiringUsers(daysUntilExpiry: number): Promise<Subscription[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysUntilExpiry);

    return this.subscriptionsRepository.find({
      where: {
        endDate: Between(now, futureDate),
        isActive: true,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['user'],
      order: { endDate: 'ASC' },
    });
  }

  async getExpiredUsers(): Promise<Subscription[]> {
    const now = new Date();

    return this.subscriptionsRepository.find({
      where: {
        endDate: LessThan(now),
        status: SubscriptionStatus.EXPIRED,
      },
      relations: ['user'],
      order: { endDate: 'DESC' },
    });
  }

  async getActiveUsers(): Promise<Subscription[]> {
    const now = new Date();

    return this.subscriptionsRepository.find({
      where: {
        endDate: MoreThan(now),
        isActive: true,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ['user'],
      order: { endDate: 'ASC' },
    });
  }

  async getInactiveUsers(): Promise<Subscription[]> {
    return this.subscriptionsRepository.find({
      where: {
        isActive: false,
      },
      relations: ['user'],
      order: { updatedAt: 'DESC' },
    });
  }

  async updateSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
    const subscription = await this.findOne(id);
    subscription.status = status;
    return this.subscriptionsRepository.save(subscription);
  }

  async deactivateSubscription(id: string): Promise<Subscription> {
    const subscription = await this.findOne(id);
    subscription.isActive = false;
    subscription.status = SubscriptionStatus.CANCELLED;
    return this.subscriptionsRepository.save(subscription);
  }

  async updateSubscriptionStatuses(): Promise<void> {
    const now = new Date();
    const fiveDaysFromNow = new Date();
    fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

    await this.subscriptionsRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.EXPIRING_SOON })
      .where('endDate BETWEEN :now AND :fiveDays', { now, fiveDays: fiveDaysFromNow })
      .andWhere('status = :active', { active: SubscriptionStatus.ACTIVE })
      .execute();

    await this.subscriptionsRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: SubscriptionStatus.EXPIRED, isActive: false })
      .where('endDate < :now', { now })
      .andWhere('status != :expired', { expired: SubscriptionStatus.EXPIRED })
      .execute();
  }

  async getUserHours(userId: string): Promise<{ 
    available: number; 
    used: number; 
    remaining: number;
    durationType: 'hours' | 'days';
    daysRemaining?: number;
  }> {
    const subscription = await this.findByUserId(userId);
    
    if (!subscription) {
      return { 
        available: 0, 
        used: 0, 
        remaining: 0, 
        durationType: 'days',
        daysRemaining: 0 
      };
    }

    const durationType = subscription.durationType || 'days';

    if (durationType === 'days') {
      const now = new Date();
      const endDate = new Date(subscription.endDate);
      const msRemaining = endDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

      console.log('[getUserHours - DAYS]', {
        userId,
        now: now.toISOString(),
        endDate: endDate.toISOString(),
        msRemaining,
        daysRemaining,
      });

      return {
        available: Number(subscription.hoursAvailable),
        used: Number(subscription.hoursUsed),
        remaining: Number(subscription.hoursAvailable),
        durationType: 'days',
        daysRemaining,
      };
    }

    if (durationType === 'hours') {
      const hoursAvailable = Number(subscription.hoursAvailable);

      if (!subscription.hoursStartedAt) {
        return {
          available: hoursAvailable,
          used: 0,
          remaining: hoursAvailable,
          durationType: 'hours',
        };
      }

      const now = new Date();
      const startTime = new Date(subscription.hoursStartedAt);
      const msElapsed = now.getTime() - startTime.getTime();
      const hoursElapsed = msElapsed / (1000 * 60 * 60);

      const remaining = Math.max(0, hoursAvailable - hoursElapsed);
      
      return {
        available: hoursAvailable,
        used: Math.min(hoursElapsed, hoursAvailable),
        remaining,
        durationType: 'hours',
      };
    }

    const remaining = Math.max(0, Number(subscription.hoursAvailable) - Number(subscription.hoursUsed));
    
    return {
      available: Number(subscription.hoursAvailable),
      used: Number(subscription.hoursUsed),
      remaining,
      durationType,
    };
  }

  async incrementUsage(userId: string, hours: number): Promise<{ 
    available: number; 
    used: number; 
    remaining: number;
    durationType?: 'hours' | 'days';
    daysRemaining?: number;
  }> {
    const subscription = await this.findByUserId(userId);
    
    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    const now = new Date();
    subscription.lastAccessAt = now;

    if (subscription.durationType === 'hours' && !subscription.hoursStartedAt) {
      subscription.hoursStartedAt = now;
      console.log(`[SubscriptionService] Iniciando contagem de horas correntes para usuário ${userId} às ${now.toISOString()}`);
    }

    if (subscription.durationType === 'days') {
      await this.subscriptionsRepository.save(subscription);
      return await this.getUserHours(userId);
    }

    if (subscription.durationType === 'hours' && subscription.hoursStartedAt) {
      const startTime = new Date(subscription.hoursStartedAt);
      const msElapsed = now.getTime() - startTime.getTime();
      const hoursElapsed = msElapsed / (1000 * 60 * 60);
      
      if (hoursElapsed >= Number(subscription.hoursAvailable)) {
        subscription.isActive = false;
        subscription.status = SubscriptionStatus.EXPIRED;
        console.log(`[SubscriptionService] Horas correntes expiraram para usuário ${userId}`);
      }
    } else {

      subscription.hoursUsed = Number(subscription.hoursUsed) + hours;
      
      const remaining = Number(subscription.hoursAvailable) - Number(subscription.hoursUsed);
      if (remaining <= 0) {
        subscription.isActive = false;
        subscription.status = SubscriptionStatus.EXPIRED;
      }
    }

    await this.subscriptionsRepository.save(subscription);

    return await this.getUserHours(userId);
  }

  async addHours(userId: string, hours: number): Promise<Subscription> {
    const subscription = await this.findByUserId(userId);
    
    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    subscription.hoursAvailable = Number(subscription.hoursAvailable) + hours;
    
    if (Number(subscription.hoursAvailable) > Number(subscription.hoursUsed)) {
      subscription.isActive = true;
      subscription.status = SubscriptionStatus.ACTIVE;
    }

    return this.subscriptionsRepository.save(subscription);
  }

  async createFreemiumSubscription(userId: string, hours: number = 2): Promise<Subscription> {
    const existing = await this.findByUserId(userId);
    
    if (existing) {
      throw new BadRequestException('Usuário já possui assinatura');
    }

    const now = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 100);

    const subscription = this.subscriptionsRepository.create({
      userId,
      hoursAvailable: hours,
      hoursUsed: 0,
      isFreemium: true,
      isActive: true,
      status: SubscriptionStatus.ACTIVE,
      startDate: now,
      endDate,
      amount: 0,
    });

    return this.subscriptionsRepository.save(subscription);
  }

  async applyPlanToUser(
    userId: string, 
    planId: string, 
    customStartDate?: string, 
    customEndDate?: string
  ): Promise<Subscription> {
    const plan = await this.plansService.findOne(planId);
    
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    let subscription = await this.findByUserId(userId);
    const now = new Date();

    let startDate = customStartDate ? new Date(customStartDate) : now;
    let endDate: Date;

    if (customEndDate) {

      endDate = new Date(customEndDate);
    } else {

      const durationType = plan.durationType || 'days';
      endDate = new Date(startDate);

      if (durationType === 'days') {
        endDate.setDate(endDate.getDate() + Number(plan.hours));
      } else {

        endDate.setFullYear(endDate.getFullYear() + 100);
      }
    }

    const durationType = plan.durationType || 'days';

    const renewalRecord: RenewalRecord = {
      date: now,
      amount: Number(plan.price),
      paymentMethod: PaymentMethod.PIX,
      duration: Number(plan.hours),
      previousEndDate: subscription?.endDate || now,
      newEndDate: endDate,
    };

    if (subscription) {

      subscription.hoursAvailable = Number(plan.hours);
      subscription.amount = Number(plan.price);
      subscription.isFreemium = false;
      subscription.isActive = true;
      subscription.status = SubscriptionStatus.ACTIVE;
      subscription.durationType = durationType;
      subscription.startDate = startDate;
      subscription.endDate = endDate;

      subscription.hoursStartedAt = null as any;
      
      subscription.renewalHistory = [...(subscription.renewalHistory || []), renewalRecord];
    } else {
      subscription = this.subscriptionsRepository.create({
        userId,
        hoursAvailable: plan.hours,
        hoursUsed: 0,
        isFreemium: false,
        isActive: true,
        status: SubscriptionStatus.ACTIVE,
        startDate: startDate,
        endDate,
        amount: plan.price,
        durationType,
        renewalHistory: [renewalRecord],
      });
    }

    const userIdNumber = parseInt(userId, 10);
    console.log(`📝 [SubscriptionsService] Updating user ${userIdNumber} (from string: ${userId}) with planId ${planId}`);
    console.log(`📝 [SubscriptionsService] Plan details - maxConcurrentIps: ${plan.maxConcurrentIps}`);
    
    const updateResult = await this.userRepository.update(userIdNumber, { 
      planId: planId,
      maxConcurrentIps: plan.maxConcurrentIps,
    });
    console.log(`✅ [SubscriptionsService] User ${userIdNumber} planId and maxConcurrentIps update result: affected=${updateResult.affected}`);

    const updatedUser = await this.userRepository.findOne({
      where: { id: userIdNumber },
      relations: ['plan'],
    });
    console.log(`🔍 [SubscriptionsService] Verification after update:`);
    console.log(`   - User ${userIdNumber} planId: ${updatedUser?.planId}`);
    console.log(`   - Plan loaded: ${!!updatedUser?.plan}`);
    console.log(`   - Plan name: ${updatedUser?.plan?.name || 'N/A'}`);
    console.log(`   - Plan maxConcurrentIps: ${updatedUser?.plan?.maxConcurrentIps || 'N/A'}`);

    console.log(`🔄 [SubscriptionsService] Disconnecting user ${userIdNumber} to force plan reload...`);
    this.presenceGateway.disconnectUserSessions(userIdNumber);

    return this.subscriptionsRepository.save(subscription);
  }

  async getUserPaymentHistory(userId: string): Promise<{
    subscription: Subscription;
    history: RenewalRecord[];
    totalPaid: number;
    totalRenewals: number;
  }> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada para este usuário');
    }

    const history = subscription.renewalHistory || [];

    const totalPaid = history.reduce((sum, record) => sum + Number(record.amount), 0);
    const totalRenewals = history.length;

    return {
      subscription,
      history: history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      totalPaid,
      totalRenewals,
    };
  }

  async updateSubscriptionsAfterPlanEdit(
    planId: string,
    oldDurationType: 'hours' | 'days',
    newDurationType: 'hours' | 'days',
    newHours: number,
  ): Promise<void> {

    if (oldDurationType === newDurationType) {
      return;
    }

    console.warn(`⚠️  Plano ${planId} teve o durationType alterado de '${oldDurationType}' para '${newDurationType}'.`);
    console.warn(`⚠️  As assinaturas existentes NÃO foram atualizadas automaticamente.`);
    console.warn(`⚠️  Para atualizar assinaturas de usuários específicos, aplique o plano novamente ao usuário.`);
  }
}
