import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Plan } from '../../plans/entities/plan.entity';
import { UserSession } from '../../presence/entities/user-session.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 6, unique: true })
  codeId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  isApproved: boolean;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'boolean', default: true })
  enableWhatsAppNotifications: boolean;

  @Column({ type: 'boolean', default: true })
  enableEmailNotifications: boolean;

  @Column({ type: 'boolean', default: true })
  enableBillingNotifications: boolean;

  @Column({ type: 'varchar', length: 50, default: 'America/Sao_Paulo' })
  timezone: string;

  @Column({ type: 'uuid', nullable: true })
  planId: string;

  @Column({ type: 'int', nullable: true, name: 'max_concurrent_ips' })
  maxConcurrentIps: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'password_reset_token' })
  passwordResetToken: string | null;

  @Column({ type: 'timestamp', nullable: true, name: 'password_reset_expires' })
  passwordResetExpires: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserSession, session => session.user)
  sessions: UserSession[];

  @ManyToOne(() => Plan, { eager: true, nullable: true })
  @JoinColumn({ name: 'planId' })
  plan: Plan;
}
