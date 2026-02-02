import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('system_settings')
export class SystemSettings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  isEncrypted: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'r2_account_id' })
  r2AccountId: string;

  @Column({ type: 'text', nullable: true, name: 'r2_access_key_id' })
  r2AccessKeyId: string;

  @Column({ type: 'text', nullable: true, name: 'r2_secret_access_key' })
  r2SecretAccessKey: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'r2_bucket_name' })
  r2BucketName: string;

  @Column({ type: 'text', nullable: true, name: 'r2_public_url' })
  r2PublicUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
