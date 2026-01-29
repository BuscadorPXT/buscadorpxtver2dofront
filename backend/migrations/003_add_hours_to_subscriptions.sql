import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHoursToSubscriptions1699999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE subscriptions
      ADD COLUMN "hoursAvailable" DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN "hoursUsed" DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN "isFreemium" BOOLEAN DEFAULT false,
      ADD COLUMN "lastAccessAt" TIMESTAMP;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE subscriptions
      DROP COLUMN "hoursAvailable",
      DROP COLUMN "hoursUsed",
      DROP COLUMN "isFreemium",
      DROP COLUMN "lastAccessAt";
    `);
  }
}
