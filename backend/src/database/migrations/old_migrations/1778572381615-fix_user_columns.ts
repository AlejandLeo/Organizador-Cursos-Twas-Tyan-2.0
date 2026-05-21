import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserColumns1778572381615 implements MigrationInterface {
    name = 'FixUserColumns1778572381615'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "solicitudes_soporte" ("id" SERIAL NOT NULL, "tipo" character varying(50) NOT NULL, "mensaje" text NOT NULL, "id_usuario" integer, "estado" integer NOT NULL DEFAULT '0', "fecha_creacion" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e98c2dfbed82040c4785d1a1ba9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "personas" ADD "perfil_completado" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "personas" ADD "ponente_configurado" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "telefono" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "email" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "organizadores" text`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "sigla" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "color_principal" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "institucion_badge" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "link_facebook" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "link_web" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "color_sigla" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "color_texto_header" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "color_titulo_2" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "color_badge_gestion" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "color_badge_institucion" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "color_badge_fecha" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "nombre_2" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "prioridad" integer NOT NULL DEFAULT '3'`);
        await queryRunner.query(`ALTER TABLE "eventos" ADD "visibilidad_al_finalizar" character varying(50) NOT NULL DEFAULT 'visible'`);
        await queryRunner.query(`ALTER TABLE "sesiones_academicas" ADD "dia" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "actividades_academicas" ADD "imagen" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "actividades_academicas" ADD "horas" integer`);
        await queryRunner.query(`ALTER TABLE "actividades_academicas" ADD "estado" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "actividades_academicas" ADD "requisitos" jsonb`);
        await queryRunner.query(`ALTER TABLE "inscripciones" ADD "datos_adicionales" jsonb`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "requiere_cambio_password" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "password_ponente" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "solicitudes_soporte" ADD CONSTRAINT "FK_e0f6228b3e8fccd3ac912f6a152" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "solicitudes_soporte" DROP CONSTRAINT "FK_e0f6228b3e8fccd3ac912f6a152"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "password_ponente"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "requiere_cambio_password"`);
        await queryRunner.query(`ALTER TABLE "inscripciones" DROP COLUMN "datos_adicionales"`);
        await queryRunner.query(`ALTER TABLE "actividades_academicas" DROP COLUMN "requisitos"`);
        await queryRunner.query(`ALTER TABLE "actividades_academicas" DROP COLUMN "estado"`);
        await queryRunner.query(`ALTER TABLE "actividades_academicas" DROP COLUMN "horas"`);
        await queryRunner.query(`ALTER TABLE "actividades_academicas" DROP COLUMN "imagen"`);
        await queryRunner.query(`ALTER TABLE "sesiones_academicas" DROP COLUMN "dia"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "visibilidad_al_finalizar"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "prioridad"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "nombre_2"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "color_badge_fecha"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "color_badge_institucion"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "color_badge_gestion"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "color_titulo_2"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "color_texto_header"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "color_sigla"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "link_web"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "link_facebook"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "institucion_badge"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "color_principal"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "sigla"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "organizadores"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "eventos" DROP COLUMN "telefono"`);
        await queryRunner.query(`ALTER TABLE "personas" DROP COLUMN "ponente_configurado"`);
        await queryRunner.query(`ALTER TABLE "personas" DROP COLUMN "perfil_completado"`);
        await queryRunner.query(`DROP TABLE "solicitudes_soporte"`);
    }

}
