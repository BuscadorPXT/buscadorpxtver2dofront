import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('page_stats')
export class PageStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'page_path', length: 500, unique: true })
  pagePath: string;

  @Column({ name: 'total_views', default: 0 })
  totalViews: number;

  @Column({ name: 'unique_users', default: 0 })
  uniqueUsers: number;

  @Column({ name: 'total_duration_seconds', type: 'bigint', default: 0 })
  totalDurationSeconds: string;

  @Column({ name: 'avg_duration_seconds', default: 0 })
  avgDurationSeconds: number;

  @Column({ name: 'last_access', type: 'timestamp', nullable: true })
  lastAccess: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
