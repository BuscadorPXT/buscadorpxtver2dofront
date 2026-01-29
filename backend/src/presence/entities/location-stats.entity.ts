import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('location_stats')
export class LocationStats {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  country: string;

  @Column({ name: 'country_code', length: 2, nullable: true })
  countryCode: string;

  @Column({ length: 100, nullable: true })
  region: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ name: 'total_sessions', default: 0 })
  totalSessions: number;

  @Column({ name: 'total_users', default: 0 })
  totalUsers: number;

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
