import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldsToInfoCertificados1778616621592 implements MigrationInterface {
    name = 'AddFieldsToInfoCertificados1778616621592'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "info_certificados" ADD "fondo_url" text`);
        await queryRunner.query(`ALTER TABLE "info_certificados" ADD "tipo" integer`);
        await queryRunner.query(`ALTER TABLE "info_certificados" ADD "configuracion" jsonb`);
        await queryRunner.query(`ALTER TABLE "info_certificados" ADD "es_excelencia" integer DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "info_certificados" DROP COLUMN "es_excelencia"`);
        await queryRunner.query(`ALTER TABLE "info_certificados" DROP COLUMN "configuracion"`);
        await queryRunner.query(`ALTER TABLE "info_certificados" DROP COLUMN "tipo"`);
        await queryRunner.query(`ALTER TABLE "info_certificados" DROP COLUMN "fondo_url"`);
    }

}
