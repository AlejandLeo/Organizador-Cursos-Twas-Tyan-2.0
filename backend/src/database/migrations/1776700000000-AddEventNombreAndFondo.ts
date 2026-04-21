import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventNombreAndFondo1776700000000 implements MigrationInterface {
  name = 'AddEventNombreAndFondo1776700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "eventos" ADD "nombre" character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" ADD "imagen_fondo" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "imagen_fondo"`);
    await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "nombre"`);
  }
}
