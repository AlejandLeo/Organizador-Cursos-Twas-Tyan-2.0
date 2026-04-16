import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";

export class SeedTestUsers1776400000000 implements MigrationInterface {
    name = 'SeedTestUsers1776400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash('Prueba1234!', saltRounds);

        const testUsers = [
            { email: 'admin_test@test.com', rolId: 1, nombres: 'Admin', apellidos: 'De Prueba' },
            { email: 'coord@test.com',      rolId: 2, nombres: 'Carlos', apellidos: 'Coordinador' },
            { email: 'logistica@test.com',  rolId: 3, nombres: 'Laura', apellidos: 'Logistica' },
            { email: 'student@test.com',    rolId: 4, nombres: 'Esteban', apellidos: 'Estudiante' },
            { email: 'ponente@test.com',    rolId: 5, nombres: 'Paula', apellidos: 'Ponente' },
        ];

        for (const u of testUsers) {
            // 1. Insertar Usuario
            const usuarioInsert = await queryRunner.query(`
                INSERT INTO "usuarios" ("email", "password", "estado", "fecha_creacion", "fecha_actualizacion")
                VALUES ($1, $2, 1, NOW(), NOW())
                ON CONFLICT ("email") DO UPDATE SET "email" = EXCLUDED."email"
                RETURNING "id"
            `, [u.email, passwordHash]);

            const usuarioId = usuarioInsert[0].id;

            // 2. Insertar Persona
            await queryRunner.query(`
                INSERT INTO "personas" ("nombres", "primer_apellido", "id_usuario", "fecha_creacion", "fecha_actualizacion")
                VALUES ($1, $2, $3, NOW(), NOW())
                ON CONFLICT ("id_usuario") DO NOTHING
            `, [u.nombres, u.apellidos, usuarioId]);

            // 3. Asignar Rol
            await queryRunner.query(`
                INSERT INTO "usuarios_roles" ("id_usuario", "id_rol", "estado", "fecha_creacion", "fecha_actualizacion")
                VALUES ($1, $2, 1, NOW(), NOW())
                ON CONFLICT ("id_usuario", "id_rol") DO NOTHING
            `, [usuarioId, u.rolId]);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const emails = [
            'admin_test@test.com',
            'coord@test.com',
            'logistica@test.com',
            'student@test.com',
            'ponente@test.com'
        ];
        await queryRunner.query(`DELETE FROM "usuarios" WHERE "email" = ANY($1)`, [emails]);
    }

}
