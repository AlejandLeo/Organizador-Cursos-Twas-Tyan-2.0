import { MigrationInterface, QueryRunner } from 'typeorm';

export class EstructuraBaseBaseDatosTYAN21775466576326 implements MigrationInterface {
  name = 'EstructuraBaseBaseDatosTYAN21775466576326';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "personas" ("id_perfil" SERIAL NOT NULL, "nombres" character varying(100), "primer_apellido" character varying(100), "segundo_apellido" character varying(100), "documento_identidad" character varying(50), "genero" character varying(20), "pais_origen" character varying(100), "pais_residencia" character varying(100), "fecha_nacimiento" date, "celular" character varying(20), "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "firma_dig" character varying(255), "id_usuario" integer, CONSTRAINT "REL_8119d9635757d434ba622f004b" UNIQUE ("id_usuario"), CONSTRAINT "PK_987ec096b44f0dbd003ded87975" PRIMARY KEY ("id_perfil"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "afiliaciones" ("id_afiliacion" SERIAL NOT NULL, "afiliacion" character varying(255), "tipo_afiliacion" character varying(100), "area_tematica" character varying(100), "disciplina_cientifica" character varying(100), "grado_academico" character varying(100), "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, CONSTRAINT "PK_4c1f7e0f90c2f4de30632d77bd9" PRIMARY KEY ("id_afiliacion"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "coordinacion_eventos" ("id_coordinacion" SERIAL NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, "id_evento" integer, CONSTRAINT "PK_15fa2fc5944c866b74690c19394" PRIMARY KEY ("id_coordinacion"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios_certificados" ("id_usuario_certificado" SERIAL NOT NULL, "tipo_relacion" character varying(50), "es_beneficiario" integer NOT NULL DEFAULT '0', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, "id_certificado" integer, CONSTRAINT "PK_1b773f39e0e3dd05649c2b8a21a" PRIMARY KEY ("id_usuario_certificado"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "certificados" ("id_certificado" SERIAL NOT NULL, "codigo_certificado" character varying(255) NOT NULL, "uuid_archivo" character varying(255) NOT NULL, "hash_integridad" character varying(255), "fecha_emision" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tipo" integer, "estado" integer NOT NULL DEFAULT '1', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_info_certificado" integer, "id_actividad_academica" integer, "id_usuario" integer, CONSTRAINT "UQ_9d5ad6c1e5e34d03cb10bb55ab2" UNIQUE ("codigo_certificado"), CONSTRAINT "UQ_15c6e71c7e8dd9b6634811dd975" UNIQUE ("uuid_archivo"), CONSTRAINT "PK_080e69b693a38ce8bd38d1662c7" PRIMARY KEY ("id_certificado"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "info_certificados" ("id_info_certificado" SERIAL NOT NULL, "cabecera" text, "tenor" text, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_evento" integer, CONSTRAINT "PK_59e85c54a6ab98493e04ff21ef9" PRIMARY KEY ("id_info_certificado"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "imparticiones" ("id_imparticion" SERIAL NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, "id_actividad_academica" integer, "id_evento" integer, CONSTRAINT "PK_aba3587157801c068c8c55f58f3" PRIMARY KEY ("id_imparticion"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "eventos" ("id_eventos" SERIAL NOT NULL, "descripcion" text, "gestion" character varying(10), "ubicacion" character varying(255), "direccion" character varying(255), "fecha_inicio" date, "fecha_fin" date, "estado" integer NOT NULL DEFAULT '1', "logo" character varying(255), "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7591086b7c125020be13bf53013" PRIMARY KEY ("id_eventos"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inscripcion_modalidades" ("id_inscripcion_modalidad" SERIAL NOT NULL, "nota" double precision, "num_asistencia" integer NOT NULL DEFAULT '0', "aprobado" integer NOT NULL DEFAULT '0', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_inscripcion" integer, "id_curso_modalidad" integer, CONSTRAINT "PK_c78e4d8f4f1fa426f131d8fd889" PRIMARY KEY ("id_inscripcion_modalidad"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "asistencias" ("id_asistencia" SERIAL NOT NULL, "fecha_hora_registro" TIMESTAMP NOT NULL DEFAULT now(), "estado" integer NOT NULL DEFAULT '1', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_inscripcion_modalidad" integer, "id_sesion_academica" integer, CONSTRAINT "PK_44d6ad0c0953f49b07ebc0badbb" PRIMARY KEY ("id_asistencia"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sesiones_academicas" ("id_sesion_academica" SERIAL NOT NULL, "fecha" date, "hora_inicio" TIME, "hora_fin" TIME, "modalidad" character varying(50), "aula" character varying(50), "cod_verificacion" character varying(100), "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_curso_modalidad" integer, CONSTRAINT "PK_9e962ace9a57dd59f05ccb16d96" PRIMARY KEY ("id_sesion_academica"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "curso_modalidades" ("id_curso_modalidad" SERIAL NOT NULL, "tipo" character varying(50), "min_nota" double precision NOT NULL DEFAULT '0', "min_asistencia" integer NOT NULL DEFAULT '0', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_actividad_academica" integer, CONSTRAINT "PK_101642fe904547bb36c41514fc2" PRIMARY KEY ("id_curso_modalidad"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "actividades_academicas" ("id_actividad_academica" SERIAL NOT NULL, "nombre" character varying(255) NOT NULL, "descripcion" text, "tipo" character varying(50), "fecha_inicio" date, "fecha_fin" date, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_evento" integer, CONSTRAINT "PK_de3031eefbd56da55ae13868d7e" PRIMARY KEY ("id_actividad_academica"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inscripciones" ("id_inscripcion" SERIAL NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "nota_principal" double precision, "miembro_tyan" integer NOT NULL DEFAULT '0', "razon" text, "estado" integer NOT NULL DEFAULT '1', "id_usuario" integer, "id_actividad_academica" integer, CONSTRAINT "PK_ab04dde6bcd98c1d0f65f665a7c" PRIMARY KEY ("id_inscripcion"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id_usuario" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "estado" integer NOT NULL DEFAULT '1', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_dfe59db369749f9042499fd8107" PRIMARY KEY ("id_usuario"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id_rol" SERIAL NOT NULL, "nombre_rol" character varying(50) NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_25f8d4161f00a1dd1cbe5068695" PRIMARY KEY ("id_rol"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios_roles" ("id_usuario_rol" SERIAL NOT NULL, "estado" integer NOT NULL DEFAULT '1', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, CONSTRAINT "PK_1a1fb01199aa47a25f1d94d2cec" PRIMARY KEY ("id_usuario_rol"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "personas" ADD CONSTRAINT "FK_8119d9635757d434ba622f004ba" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "afiliaciones" ADD CONSTRAINT "FK_e926c6dd9922ed725ecc4678ebd" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coordinacion_eventos" ADD CONSTRAINT "FK_402ff63ff5650f8aac8a5d67b85" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "coordinacion_eventos" ADD CONSTRAINT "FK_4ce7acbd6de2b21720f6b816085" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id_eventos") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_certificados" ADD CONSTRAINT "FK_33f4e720a49a7e52c18def89fdd" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_certificados" ADD CONSTRAINT "FK_1dd649ab2958be2093bc5c36784" FOREIGN KEY ("id_certificado") REFERENCES "certificados"("id_certificado") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificados" ADD CONSTRAINT "FK_de56774610a130613f5c020b991" FOREIGN KEY ("id_info_certificado") REFERENCES "info_certificados"("id_info_certificado") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificados" ADD CONSTRAINT "FK_92e39c703e2b2a70557279c036e" FOREIGN KEY ("id_actividad_academica") REFERENCES "actividades_academicas"("id_actividad_academica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificados" ADD CONSTRAINT "FK_1bb6179d0bd5feaff498118fa82" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "info_certificados" ADD CONSTRAINT "FK_35bcb71c445163ad90d394e2855" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id_eventos") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "imparticiones" ADD CONSTRAINT "FK_eb807694ca272ad53b12f3c61b7" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "imparticiones" ADD CONSTRAINT "FK_64f05a3f76f588026d26d0b786e" FOREIGN KEY ("id_actividad_academica") REFERENCES "actividades_academicas"("id_actividad_academica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "imparticiones" ADD CONSTRAINT "FK_bd009dd23d411f925097556f902" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id_eventos") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_modalidades" ADD CONSTRAINT "FK_e421278afb7e5a4cb0d29f264ff" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripciones"("id_inscripcion") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_modalidades" ADD CONSTRAINT "FK_4bba35d882698c648558162919d" FOREIGN KEY ("id_curso_modalidad") REFERENCES "curso_modalidades"("id_curso_modalidad") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" ADD CONSTRAINT "FK_9fc6076bcebdd2dd7a759bd414c" FOREIGN KEY ("id_inscripcion_modalidad") REFERENCES "inscripcion_modalidades"("id_inscripcion_modalidad") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" ADD CONSTRAINT "FK_d0e7dcb2da46a2bc9edd48681e1" FOREIGN KEY ("id_sesion_academica") REFERENCES "sesiones_academicas"("id_sesion_academica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones_academicas" ADD CONSTRAINT "FK_46576fd7c630ad40375f95b4448" FOREIGN KEY ("id_curso_modalidad") REFERENCES "curso_modalidades"("id_curso_modalidad") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "curso_modalidades" ADD CONSTRAINT "FK_2c6730133591486741a2cc0ad86" FOREIGN KEY ("id_actividad_academica") REFERENCES "actividades_academicas"("id_actividad_academica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_academicas" ADD CONSTRAINT "FK_120cf911334d40fc3cd159d3807" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id_eventos") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripciones" ADD CONSTRAINT "FK_303f97e84e11e88de9c473628aa" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripciones" ADD CONSTRAINT "FK_a9b6a1c2008f3cb8265d2fdd26e" FOREIGN KEY ("id_actividad_academica") REFERENCES "actividades_academicas"("id_actividad_academica") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_roles" ADD CONSTRAINT "FK_fff4c9f548a476cc170128314dc" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios_roles" DROP CONSTRAINT "FK_fff4c9f548a476cc170128314dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripciones" DROP CONSTRAINT "FK_a9b6a1c2008f3cb8265d2fdd26e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripciones" DROP CONSTRAINT "FK_303f97e84e11e88de9c473628aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actividades_academicas" DROP CONSTRAINT "FK_120cf911334d40fc3cd159d3807"`,
    );
    await queryRunner.query(
      `ALTER TABLE "curso_modalidades" DROP CONSTRAINT "FK_2c6730133591486741a2cc0ad86"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sesiones_academicas" DROP CONSTRAINT "FK_46576fd7c630ad40375f95b4448"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" DROP CONSTRAINT "FK_d0e7dcb2da46a2bc9edd48681e1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "asistencias" DROP CONSTRAINT "FK_9fc6076bcebdd2dd7a759bd414c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_modalidades" DROP CONSTRAINT "FK_4bba35d882698c648558162919d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inscripcion_modalidades" DROP CONSTRAINT "FK_e421278afb7e5a4cb0d29f264ff"`,
    );
    await queryRunner.query(
      `ALTER TABLE "imparticiones" DROP CONSTRAINT "FK_bd009dd23d411f925097556f902"`,
    );
    await queryRunner.query(
      `ALTER TABLE "imparticiones" DROP CONSTRAINT "FK_64f05a3f76f588026d26d0b786e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "imparticiones" DROP CONSTRAINT "FK_eb807694ca272ad53b12f3c61b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "info_certificados" DROP CONSTRAINT "FK_35bcb71c445163ad90d394e2855"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificados" DROP CONSTRAINT "FK_1bb6179d0bd5feaff498118fa82"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificados" DROP CONSTRAINT "FK_92e39c703e2b2a70557279c036e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "certificados" DROP CONSTRAINT "FK_de56774610a130613f5c020b991"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_certificados" DROP CONSTRAINT "FK_1dd649ab2958be2093bc5c36784"`,
    );
    await queryRunner.query(
      `ALTER TABLE "usuarios_certificados" DROP CONSTRAINT "FK_33f4e720a49a7e52c18def89fdd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coordinacion_eventos" DROP CONSTRAINT "FK_4ce7acbd6de2b21720f6b816085"`,
    );
    await queryRunner.query(
      `ALTER TABLE "coordinacion_eventos" DROP CONSTRAINT "FK_402ff63ff5650f8aac8a5d67b85"`,
    );
    await queryRunner.query(
      `ALTER TABLE "afiliaciones" DROP CONSTRAINT "FK_e926c6dd9922ed725ecc4678ebd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "personas" DROP CONSTRAINT "FK_8119d9635757d434ba622f004ba"`,
    );
    await queryRunner.query(`DROP TABLE "usuarios_roles"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TABLE "inscripciones"`);
    await queryRunner.query(`DROP TABLE "actividades_academicas"`);
    await queryRunner.query(`DROP TABLE "curso_modalidades"`);
    await queryRunner.query(`DROP TABLE "sesiones_academicas"`);
    await queryRunner.query(`DROP TABLE "asistencias"`);
    await queryRunner.query(`DROP TABLE "inscripcion_modalidades"`);
    await queryRunner.query(`DROP TABLE "eventos"`);
    await queryRunner.query(`DROP TABLE "imparticiones"`);
    await queryRunner.query(`DROP TABLE "info_certificados"`);
    await queryRunner.query(`DROP TABLE "certificados"`);
    await queryRunner.query(`DROP TABLE "usuarios_certificados"`);
    await queryRunner.query(`DROP TABLE "coordinacion_eventos"`);
    await queryRunner.query(`DROP TABLE "afiliaciones"`);
    await queryRunner.query(`DROP TABLE "personas"`);
  }
}
