import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameIdsToId1776149694188 implements MigrationInterface {
  name = 'RenameIdsToId1776149694188';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "personas" RENAME COLUMN "id_perfil" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "personas" RENAME CONSTRAINT "PK_987ec096b44f0dbd003ded87975" TO "PK_714aa5d028f8f3e6645e971cecd"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "personas_id_perfil_seq" RENAME TO "personas_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "afiliaciones" RENAME COLUMN "id_afiliacion" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "afiliaciones" RENAME CONSTRAINT "PK_4c1f7e0f90c2f4de30632d77bd9" TO "PK_9444726745f6df5d60be7ec2580"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "afiliaciones_id_afiliacion_seq" RENAME TO "afiliaciones_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coordinacion_eventos" RENAME COLUMN "id_coordinacion" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coordinacion_eventos" RENAME CONSTRAINT "PK_15fa2fc5944c866b74690c19394" TO "PK_8cf68e81da06e3ab1abf304d6a0"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "coordinacion_eventos_id_coordinacion_seq" RENAME TO "coordinacion_eventos_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_certificados" RENAME COLUMN "id_usuario_certificado" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_certificados" RENAME CONSTRAINT "PK_1b773f39e0e3dd05649c2b8a21a" TO "PK_3cd69ad2f0abb44d26da2204c24"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "usuarios_certificados_id_usuario_certificado_seq" RENAME TO "usuarios_certificados_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificados" RENAME COLUMN "id_certificado" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificados" RENAME CONSTRAINT "PK_080e69b693a38ce8bd38d1662c7" TO "PK_e9b232ca7a16db08667f021708f"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "certificados_id_certificado_seq" RENAME TO "certificados_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "info_certificados" RENAME COLUMN "id_info_certificado" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "info_certificados" RENAME CONSTRAINT "PK_59e85c54a6ab98493e04ff21ef9" TO "PK_a5b1efccccb4f1e22f25c9b1cd5"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "info_certificados_id_info_certificado_seq" RENAME TO "info_certificados_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "imparticiones" RENAME COLUMN "id_imparticion" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "imparticiones" RENAME CONSTRAINT "PK_aba3587157801c068c8c55f58f3" TO "PK_9bdf733d7a399d6eafb8b4f7109"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "imparticiones_id_imparticion_seq" RENAME TO "imparticiones_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" RENAME COLUMN "id_eventos" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" RENAME CONSTRAINT "PK_7591086b7c125020be13bf53013" TO "PK_40d4a3c6a4bfd24280cb97a509e"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "eventos_id_eventos_seq" RENAME TO "eventos_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_modalidades" RENAME COLUMN "id_inscripcion_modalidad" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_modalidades" RENAME CONSTRAINT "PK_c78e4d8f4f1fa426f131d8fd889" TO "PK_102a80845be3b212e67f1c5b6b9"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "inscripcion_modalidades_id_inscripcion_modalidad_seq" RENAME TO "inscripcion_modalidades_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" RENAME COLUMN "id_asistencia" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" RENAME CONSTRAINT "PK_44d6ad0c0953f49b07ebc0badbb" TO "PK_f7eb09d44d6c7dd4ccc6eb29af8"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "asistencias_id_asistencia_seq" RENAME TO "asistencias_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones_academicas" RENAME COLUMN "id_sesion_academica" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones_academicas" RENAME CONSTRAINT "PK_9e962ace9a57dd59f05ccb16d96" TO "PK_33002ca0d13d0eb3e0487095adb"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "sesiones_academicas_id_sesion_academica_seq" RENAME TO "sesiones_academicas_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curso_modalidades" RENAME COLUMN "id_curso_modalidad" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curso_modalidades" RENAME CONSTRAINT "PK_101642fe904547bb36c41514fc2" TO "PK_c092e55c89afd2b353c5377a841"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "curso_modalidades_id_curso_modalidad_seq" RENAME TO "curso_modalidades_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_academicas" RENAME COLUMN "id_actividad_academica" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_academicas" RENAME CONSTRAINT "PK_de3031eefbd56da55ae13868d7e" TO "PK_9398be13474c44f07dabb4c6fe2"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "actividades_academicas_id_actividad_academica_seq" RENAME TO "actividades_academicas_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripciones" RENAME COLUMN "id_inscripcion" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripciones" RENAME CONSTRAINT "PK_ab04dde6bcd98c1d0f65f665a7c" TO "PK_17a12f6ab342f6762d81e940d19"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "inscripciones_id_inscripcion_seq" RENAME TO "inscripciones_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" RENAME COLUMN "id_usuario" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" RENAME CONSTRAINT "PK_dfe59db369749f9042499fd8107" TO "PK_d7281c63c176e152e4c531594a8"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "usuarios_id_usuario_seq" RENAME TO "usuarios_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" RENAME COLUMN "id_rol" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" RENAME CONSTRAINT "PK_25f8d4161f00a1dd1cbe5068695" TO "PK_c1433d71a4838793a49dcad46ab"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "roles_id_rol_seq" RENAME TO "roles_id_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_roles" RENAME COLUMN "id_usuario_rol" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_roles" RENAME CONSTRAINT "PK_1a1fb01199aa47a25f1d94d2cec" TO "PK_28de221731be7761ba1b165df08"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "usuarios_roles_id_usuario_rol_seq" RENAME TO "usuarios_roles_id_seq"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER SEQUENCE "usuarios_roles_id_seq" RENAME TO "usuarios_roles_id_usuario_rol_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_roles" RENAME CONSTRAINT "PK_28de221731be7761ba1b165df08" TO "PK_1a1fb01199aa47a25f1d94d2cec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_roles" RENAME COLUMN "id" TO "id_usuario_rol"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "roles_id_seq" RENAME TO "roles_id_rol_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" RENAME CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" TO "PK_25f8d4161f00a1dd1cbe5068695"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" RENAME COLUMN "id" TO "id_rol"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "usuarios_id_seq" RENAME TO "usuarios_id_usuario_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" RENAME CONSTRAINT "PK_d7281c63c176e152e4c531594a8" TO "PK_dfe59db369749f9042499fd8107"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios" RENAME COLUMN "id" TO "id_usuario"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "inscripciones_id_seq" RENAME TO "inscripciones_id_inscripcion_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripciones" RENAME CONSTRAINT "PK_17a12f6ab342f6762d81e940d19" TO "PK_ab04dde6bcd98c1d0f65f665a7c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripciones" RENAME COLUMN "id" TO "id_inscripcion"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "actividades_academicas_id_seq" RENAME TO "actividades_academicas_id_actividad_academica_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_academicas" RENAME CONSTRAINT "PK_9398be13474c44f07dabb4c6fe2" TO "PK_de3031eefbd56da55ae13868d7e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_academicas" RENAME COLUMN "id" TO "id_actividad_academica"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "curso_modalidades_id_seq" RENAME TO "curso_modalidades_id_curso_modalidad_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curso_modalidades" RENAME CONSTRAINT "PK_c092e55c89afd2b353c5377a841" TO "PK_101642fe904547bb36c41514fc2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curso_modalidades" RENAME COLUMN "id" TO "id_curso_modalidad"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "sesiones_academicas_id_seq" RENAME TO "sesiones_academicas_id_sesion_academica_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones_academicas" RENAME CONSTRAINT "PK_33002ca0d13d0eb3e0487095adb" TO "PK_9e962ace9a57dd59f05ccb16d96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones_academicas" RENAME COLUMN "id" TO "id_sesion_academica"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "asistencias_id_seq" RENAME TO "asistencias_id_asistencia_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" RENAME CONSTRAINT "PK_f7eb09d44d6c7dd4ccc6eb29af8" TO "PK_44d6ad0c0953f49b07ebc0badbb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" RENAME COLUMN "id" TO "id_asistencia"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "inscripcion_modalidades_id_seq" RENAME TO "inscripcion_modalidades_id_inscripcion_modalidad_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_modalidades" RENAME CONSTRAINT "PK_102a80845be3b212e67f1c5b6b9" TO "PK_c78e4d8f4f1fa426f131d8fd889"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_modalidades" RENAME COLUMN "id" TO "id_inscripcion_modalidad"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "eventos_id_seq" RENAME TO "eventos_id_eventos_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" RENAME CONSTRAINT "PK_40d4a3c6a4bfd24280cb97a509e" TO "PK_7591086b7c125020be13bf53013"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" RENAME COLUMN "id" TO "id_eventos"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "imparticiones_id_seq" RENAME TO "imparticiones_id_imparticion_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "imparticiones" RENAME CONSTRAINT "PK_9bdf733d7a399d6eafb8b4f7109" TO "PK_aba3587157801c068c8c55f58f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "imparticiones" RENAME COLUMN "id" TO "id_imparticion"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "info_certificados_id_seq" RENAME TO "info_certificados_id_info_certificado_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "info_certificados" RENAME CONSTRAINT "PK_a5b1efccccb4f1e22f25c9b1cd5" TO "PK_59e85c54a6ab98493e04ff21ef9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "info_certificados" RENAME COLUMN "id" TO "id_info_certificado"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "certificados_id_seq" RENAME TO "certificados_id_certificado_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificados" RENAME CONSTRAINT "PK_e9b232ca7a16db08667f021708f" TO "PK_080e69b693a38ce8bd38d1662c7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificados" RENAME COLUMN "id" TO "id_certificado"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "usuarios_certificados_id_seq" RENAME TO "usuarios_certificados_id_usuario_certificado_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_certificados" RENAME CONSTRAINT "PK_3cd69ad2f0abb44d26da2204c24" TO "PK_1b773f39e0e3dd05649c2b8a21a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_certificados" RENAME COLUMN "id" TO "id_usuario_certificado"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "coordinacion_eventos_id_seq" RENAME TO "coordinacion_eventos_id_coordinacion_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coordinacion_eventos" RENAME CONSTRAINT "PK_8cf68e81da06e3ab1abf304d6a0" TO "PK_15fa2fc5944c866b74690c19394"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coordinacion_eventos" RENAME COLUMN "id" TO "id_coordinacion"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "afiliaciones_id_seq" RENAME TO "afiliaciones_id_afiliacion_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "afiliaciones" RENAME CONSTRAINT "PK_9444726745f6df5d60be7ec2580" TO "PK_4c1f7e0f90c2f4de30632d77bd9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "afiliaciones" RENAME COLUMN "id" TO "id_afiliacion"`,
    );
    await queryRunner.query(
      `ALTER SEQUENCE "personas_id_seq" RENAME TO "personas_id_perfil_seq"`,
    );
    await queryRunner.query(
      `ALTER TABLE "personas" RENAME CONSTRAINT "PK_714aa5d028f8f3e6645e971cecd" TO "PK_987ec096b44f0dbd003ded87975"`,
    );
    await queryRunner.query(
      `ALTER TABLE "personas" RENAME COLUMN "id" TO "id_perfil"`,
    );
  }
}
