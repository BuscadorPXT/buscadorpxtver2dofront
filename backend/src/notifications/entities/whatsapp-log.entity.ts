import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum WhatsAppMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  DOCUMENT = 'document',
  BUTTON = 'button',
  PRODUCT_NOTIFICATION = 'product_notification',
  PRICE_ALERT = 'price_alert',
  REPORT = 'report',
  SUBSCRIPTION_REMINDER = 'subscription_reminder',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  TESTER_EXPIRED = 'tester_expired',
  WELCOME_REGISTRATION = 'welcome_registration',
  TEST_NOTIFICATION = 'test_notification',
}

export enum WhatsAppLogStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  PENDING = 'pending',
}

@Entity('whatsapp_logs')
@Index(['userId'])
@Index(['status'])
@Index(['messageType'])
@Index(['createdAt'])
export class WhatsAppLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({
    type: 'enum',
    enum: WhatsAppMessageType,
    default: WhatsAppMessageType.TEXT,
  })
  messageType: WhatsAppMessageType;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: WhatsAppLogStatus,
    default: WhatsAppLogStatus.PENDING,
  })
  status: WhatsAppLogStatus;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'varchar', nullable: true })
  zapiMessageId: string;

  @Column({ type: 'int', default: 1 })
  attempts: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;
}
