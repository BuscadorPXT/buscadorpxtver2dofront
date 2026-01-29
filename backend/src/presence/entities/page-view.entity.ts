import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserSession } from './user-session.entity';

@Entity('page_views')
export class PageView {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId: string;

  @ManyToOne(() => UserSession, session => session.pageViews, { nullable: true })
  @JoinColumn({ name: 'session_id' })
  session: UserSession;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'page_path', length: 500 })
  pagePath: string;

  @Column({ name: 'page_title', length: 255, nullable: true })
  pageTitle: string;

  @CreateDateColumn({ name: 'entered_at' })
  enteredAt: Date;

  @Column({ name: 'left_at', type: 'timestamp', nullable: true })
  leftAt: Date;

  @Column({ name: 'duration_seconds', nullable: true })
  durationSeconds: number;

  @Column({ length: 500, nullable: true })
  referrer: string;
}
