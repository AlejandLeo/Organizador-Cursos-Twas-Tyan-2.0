import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración: Seed de los roles iniciales del sistema.
 *
 * Roles:
 *  1 - Super Usuario
 *  2 - Coordinador
 *  3 - Logistica
 *  4 - Estudiante
 *  5 - Ponente
 *
 * Usa INSERT ... ON CONFLICT DO NOTHING para que sea idempotente
 * (se puede correr varias veces sin duplicar registros).
 */
export class SeedRolesIniciales1776200000000 implements MigrationInterface {
  name = 'SeedRolesIniciales1776200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "roles" ("id", "nombre_rol", "fecha_creacion", "fecha_actualizacion")
      VALUES
        (1, 'Super Usuario', NOW(), NOW()),
        (2, 'Coordinador',   NOW(), NOW()),
        (3, 'Logistica',     NOW(), NOW()),
        (4, 'Estudiante',    NOW(), NOW()),
        (5, 'Ponente',       NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Sincronizar la secuencia para que el siguiente auto-increment
    // comience en 6, evitando colisiones con los IDs ya insertados.
    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('"roles"', 'id'), COALESCE(MAX(id), 5))
      FROM "roles";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "roles"
      WHERE id IN (1, 2, 3, 4, 5);
    `);
  }
}
