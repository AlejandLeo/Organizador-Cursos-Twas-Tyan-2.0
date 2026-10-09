import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnviosToCertificados1791504000000 implements MigrationInterface {
  name = 'AddEnviosToCertificados1791504000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "certificados" ADD COLUMN IF NOT EXISTS "envios" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "certificados" DROP COLUMN IF EXISTS "envios"`);
  }
}
