import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRING_SOON = 'expiring_soon',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum SubscriptionPlan {
  MONTHLY = 'monthly',
  BIWEEKLY = 'biweekly',
  WEEKLY = 'weekly',
}

export enum PaymentMethod {
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  CASH = 'cash',
}

export interface RenewalRecord {
  date: Date;
  amount: number;
  paymentMethod: PaymentMethod;
  duration: number;
  previousEndDate: Date;
  newEndDate: Date;
}

@Entity('subscriptions')
@Index(['endDate'])
@Index(['status'])
@Index(['userId'])
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.MONTHLY,
  })
  plan: SubscriptionPlan;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 289.9 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.PIX,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: [] })
  renewalHistory: RenewalRecord[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hoursAvailable: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hoursUsed: number;

  @Column({ type: 'boolean', default: false })
  isFreemium: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastAccessAt: Date;

  @Column({ name: 'duration_type', type: 'varchar', length: 10, default: 'days' })
  durationType: 'hours' | 'days';

  @Column({ type: 'timestamp', nullable: true })
  hoursStartedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
