import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

export class SeedSuperUsuario1776300000000 implements MigrationInterface {
  name = 'SeedSuperUsuario1776300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Datos del Super Usuario
    const email = 'admin@organizador.com';
    const passwordPlain = 'Admin_Organizador_2026!';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(passwordPlain, saltRounds);

    // 2. Insertar en tabla: usuarios
    // Nota: Insertamos con id fijo 1 para facilitar el seed,
    // pero usamos ON CONFLICT por si ya existe el ID o el email.
    const usuarioInsert = await queryRunner.query(
      `
            INSERT INTO "usuarios" ("email", "password", "estado", "fecha_creacion", "fecha_actualizacion")
            VALUES ($1, $2, 1, NOW(), NOW())
            ON CONFLICT ("email") DO UPDATE SET "email" = EXCLUDED."email"
            RETURNING "id"
        `,
      [email, passwordHash],
    );

    const usuarioId = usuarioInsert[0].id;

    // 3. Insertar en tabla: personas
    await queryRunner.query(
      `
            INSERT INTO "personas" ("nombres", "primer_apellido", "id_usuario", "fecha_creacion", "fecha_actualizacion")
            VALUES ($1, $2, $3, NOW(), NOW())
            ON CONFLICT ("id_usuario") DO NOTHING
        `,
      ['Administrador', 'Sistema', usuarioId],
    );

    // 4. Asignar Rol: Super Usuario (ID 1)
    await queryRunner.query(
      `
            INSERT INTO "usuarios_roles" ("id_usuario", "id_rol", "estado", "fecha_creacion", "fecha_actualizacion")
            SELECT $1, 1, 1, NOW(), NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM "usuarios_roles" WHERE "id_usuario" = $1 AND "id_rol" = 1
            )
        `,
      [usuarioId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Opcional: Eliminar el usuario por email
    // El CASCADE en la base de datos se encargará de 'personas' y 'usuarios_roles'
    // si la relación está configurada con onDelete: 'CASCADE'.
    await queryRunner.query(
      `DELETE FROM "usuarios" WHERE "email" = 'admin@organizador.com'`,
    );
  }
}
