import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlterPersonaGeneroInteger1776600000000 implements MigrationInterface {
  name = 'AlterPersonaGeneroInteger1776600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Cambiar la columna genero de VARCHAR a INTEGER.
    // Si hay datos que no son números (ej: 'Masculino'), los convertiremos a 0 por defecto.
    await queryRunner.query(`
            ALTER TABLE "personas" 
            ALTER COLUMN "genero" TYPE integer 
            USING (CASE 
                WHEN "genero" = 'Masculino' THEN 0
                WHEN "genero" = 'Femenino' THEN 1
                WHEN "genero" = 'Otro' THEN 2
                WHEN "genero" = 'Prefiero no decir' THEN 3
                WHEN "genero" ~ '^[0-9]+$' THEN "genero"::integer
                ELSE 0
            END)
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir a VARCHAR
    await queryRunner.query(`
            ALTER TABLE "personas" 
            ALTER COLUMN "genero" TYPE varchar(20) 
            USING (CASE 
                WHEN "genero" = 0 THEN 'Masculino'
                WHEN "genero" = 1 THEN 'Femenino'
                WHEN "genero" = 2 THEN 'Otro'
                WHEN "genero" = 3 THEN 'Prefiero no decir'
                ELSE "genero"::varchar
            END)
        `);
  }
}
