import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_sessions')
@Index(['userId', 'ipAddress'], { unique: true })
export class UserSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'userId', type: 'int' })
    @Index()
    userId: number;

    @Column({ name: 'ipAddress', type: 'varchar', length: 45 })
    @Index()
    ipAddress: string;

    @Column({ name: 'userAgent', type: 'text', nullable: true })
    userAgent: string;

    @Column({ name: 'lastActivityAt', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    @Index()
    lastActivityAt: Date;

    @CreateDateColumn({ name: 'createdAt' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt: Date;

    @ManyToOne(() => User, user => user.sessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;
}
