import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlansTable1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE plans (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(100) UNIQUE NOT NULL,
        "description" TEXT,
        "hours" DECIMAL(10,2) NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "features" JSONB DEFAULT '[]',
        "color" VARCHAR(7),
        "displayOrder" INTEGER DEFAULT 0,
        "whatsappNumber" VARCHAR(20),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX idx_plans_is_active ON plans("isActive");
      CREATE INDEX idx_plans_display_order ON plans("displayOrder");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE plans;`);
  }
}
