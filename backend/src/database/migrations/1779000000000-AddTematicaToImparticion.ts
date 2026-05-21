import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTematicaToImparticion1779000000000 implements MigrationInterface {
    name = 'AddTematicaToImparticion1779000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "imparticiones" ADD "tematica" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "imparticiones" DROP COLUMN "tematica"`);
    }
}
