import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMissingColumnsToEventos1776900000000 implements MigrationInterface {
    name = 'AddMissingColumnsToEventos1776900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Añadir columnas una por una si no existen
        await queryRunner.query(`ALTER TABLE "eventos" ADD COLUMN IF NOT EXISTS "version" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD COLUMN IF NOT EXISTS "sobre_evento_1" text`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD COLUMN IF NOT EXISTS "sobre_evento_2" text`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD COLUMN IF NOT EXISTS "frase_destacada" text`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD COLUMN IF NOT EXISTS "google_maps_link" text`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD COLUMN IF NOT EXISTS "cronograma" text`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD COLUMN IF NOT EXISTS "imagen_fondo" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "version"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "sobre_evento_1"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "sobre_evento_2"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "frase_destacada"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "google_maps_link"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "cronograma"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "imagen_fondo"`);
    }
}
