import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'duration_type', type: 'varchar', length: 10, default: 'hours' })
  durationType: 'hours' | 'days';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  hours: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: [] })
  features: string[];

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsappNumber: string;

  @Column({ type: 'int', default: 1 })
  maxConcurrentIps: number;

  @Column({ type: 'boolean', default: false })
  disableSupplierContact: boolean;

  @Column({ type: 'boolean', default: false })
  hideSupplier: boolean;

  @Column({ name: 'is_test_plan', type: 'boolean', default: false })
  isTestPlan: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
