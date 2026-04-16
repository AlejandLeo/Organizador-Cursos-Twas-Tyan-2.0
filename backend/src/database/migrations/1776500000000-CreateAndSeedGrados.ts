import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAndSeedGrados1776500000000 implements MigrationInterface {
  name = 'CreateAndSeedGrados1776500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla grados_academicos
    await queryRunner.query(`
            CREATE TABLE "grados_academicos" (
                "id" SERIAL PRIMARY KEY,
                "descripcion" CHARACTER VARYING(100) NOT NULL,
                "abreviacion" CHARACTER VARYING(20),
                "fecha_creacion" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "fecha_actualizacion" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);

    // 2. Sembrar valores iniciales
    const grados = [
      ['Licenciatura', 'Lic.'],
      ['Maestría', 'Msc.'],
      ['Doctorado', 'Dr.'],
    ];

    for (const [desc, abrev] of grados) {
      await queryRunner.query(
        `INSERT INTO "grados_academicos" (descripcion, abreviacion) VALUES ($1, $2)`,
        [desc, abrev],
      );
    }

    // 3. Modificar tabla afiliaciones
    // Añadir columna id_grado_academico
    await queryRunner.query(
      `ALTER TABLE "afiliaciones" ADD "id_grado_academico" integer`,
    );

    // Crear FK
    await queryRunner.query(`
            ALTER TABLE "afiliaciones" 
            ADD CONSTRAINT "FK_afiliacion_grado_academico" 
            FOREIGN KEY ("id_grado_academico") 
            REFERENCES "grados_academicos"("id") ON DELETE SET NULL
        `);

    // Eliminar columna antigua grado_academico (string)
    // NOTA: En un escenario real migraríamos los datos existentes,
    // pero como estamos en desarrollo inicial, procedemos con la limpieza.
    await queryRunner.query(
      `ALTER TABLE "afiliaciones" DROP COLUMN "grado_academico"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "afiliaciones" DROP CONSTRAINT "FK_afiliacion_grado_academico"`,
    );
    await queryRunner.query(
      `ALTER TABLE "afiliaciones" ADD "grado_academico" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "afiliaciones" DROP COLUMN "id_grado_academico"`,
    );
    await queryRunner.query(`DROP TABLE "grados_academicos"`);
  }
}
