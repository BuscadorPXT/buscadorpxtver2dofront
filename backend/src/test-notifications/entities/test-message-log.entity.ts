import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('test_messages_log')
export class TestMessageLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'message_type', type: 'varchar', length: 20 })
  messageType: '6h_before' | '1h_before' | 'post_test';

  @Column({ name: 'sent_at', type: 'timestamp', default: () => 'NOW()' })
  sentAt: Date;

  @Column({ name: 'test_end_time', type: 'timestamp' })
  testEndTime: Date;

  @Column({ name: 'message_content', type: 'text' })
  messageContent: string;

  @Column({ name: 'whatsapp_response', type: 'jsonb', nullable: true })
  whatsappResponse: any;

  @Column({ type: 'varchar', length: 20, default: 'sent' })
  status: 'sent' | 'failed' | 'pending';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
