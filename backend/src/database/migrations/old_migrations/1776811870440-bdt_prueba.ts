import { MigrationInterface, QueryRunner } from "typeorm";

export class BdtPrueba1776811870440 implements MigrationInterface {
    name = 'BdtPrueba1776811870440'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "personas" ("id" SERIAL NOT NULL, "nombres" character varying(100), "primer_apellido" character varying(100), "segundo_apellido" character varying(100), "documento_identidad" character varying(50), "genero" integer, "pais_origen" character varying(100), "pais_residencia" character varying(100), "fecha_nacimiento" date, "celular" character varying(20), "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "firma_dig" character varying(255), "id_usuario" integer, CONSTRAINT "REL_8119d9635757d434ba622f004b" UNIQUE ("id_usuario"), CONSTRAINT "PK_714aa5d028f8f3e6645e971cecd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "grados_academicos" ("id" SERIAL NOT NULL, "descripcion" character varying(100) NOT NULL, "abreviacion" character varying(20), "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c8924dbf738f9fb7ce777bbfc8d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "afiliaciones" ("id" SERIAL NOT NULL, "afiliacion" character varying(255), "tipo_afiliacion" character varying(100), "area_tematica" character varying(100), "disciplina_cientifica" character varying(100), "id_grado_academico" integer, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, CONSTRAINT "PK_9444726745f6df5d60be7ec2580" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "coordinacion_eventos" ("id" SERIAL NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, "id_evento" integer, CONSTRAINT "PK_8cf68e81da06e3ab1abf304d6a0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "usuarios_certificados" ("id" SERIAL NOT NULL, "tipo_relacion" character varying(50), "es_beneficiario" integer NOT NULL DEFAULT '0', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, "id_certificado" integer, CONSTRAINT "PK_3cd69ad2f0abb44d26da2204c24" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "certificados" ("id" SERIAL NOT NULL, "codigo_certificado" character varying(255) NOT NULL, "uuid_archivo" character varying(255) NOT NULL, "hash_integridad" character varying(255), "fecha_emision" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "tipo" integer, "estado" integer NOT NULL DEFAULT '1', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_info_certificado" integer, "id_actividad_academica" integer, "id_usuario" integer, CONSTRAINT "UQ_9d5ad6c1e5e34d03cb10bb55ab2" UNIQUE ("codigo_certificado"), CONSTRAINT "UQ_15c6e71c7e8dd9b6634811dd975" UNIQUE ("uuid_archivo"), CONSTRAINT "PK_e9b232ca7a16db08667f021708f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "info_certificados" ("id" SERIAL NOT NULL, "cabecera" text, "tenor" text, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_evento" integer, CONSTRAINT "PK_a5b1efccccb4f1e22f25c9b1cd5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "imparticiones" ("id" SERIAL NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, "id_actividad_academica" integer, "id_evento" integer, CONSTRAINT "PK_9bdf733d7a399d6eafb8b4f7109" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "eventos" ("id" SERIAL NOT NULL, "nombre" character varying(255), "descripcion" text, "gestion" character varying(10), "ubicacion" character varying(255), "direccion" character varying(255), "fecha_inicio" date, "fecha_fin" date, "estado" integer NOT NULL DEFAULT '1', "logo" character varying(255), "imagen_fondo" character varying(255), "version" character varying(150), "sobre_evento_1" text, "sobre_evento_2" text, "frase_destacada" text, "google_maps_link" text, "cronograma" text, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_40d4a3c6a4bfd24280cb97a509e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inscripcion_modalidades" ("id" SERIAL NOT NULL, "nota" double precision, "num_asistencia" integer NOT NULL DEFAULT '0', "aprobado" integer NOT NULL DEFAULT '0', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_inscripcion" integer, "id_curso_modalidad" integer, CONSTRAINT "PK_102a80845be3b212e67f1c5b6b9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "asistencias" ("id" SERIAL NOT NULL, "fecha_hora_registro" TIMESTAMP NOT NULL DEFAULT now(), "estado" integer NOT NULL DEFAULT '1', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_inscripcion_modalidad" integer, "id_sesion_academica" integer, CONSTRAINT "PK_f7eb09d44d6c7dd4ccc6eb29af8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sesiones_academicas" ("id" SERIAL NOT NULL, "fecha" date, "hora_inicio" TIME, "hora_fin" TIME, "modalidad" character varying(50), "aula" character varying(50), "cod_verificacion" character varying(100), "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_curso_modalidad" integer, CONSTRAINT "PK_33002ca0d13d0eb3e0487095adb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "curso_modalidades" ("id" SERIAL NOT NULL, "tipo" character varying(50), "min_nota" double precision NOT NULL DEFAULT '0', "min_asistencia" integer NOT NULL DEFAULT '0', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_actividad_academica" integer, CONSTRAINT "PK_c092e55c89afd2b353c5377a841" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "actividades_academicas" ("id" SERIAL NOT NULL, "nombre" character varying(255) NOT NULL, "descripcion" text, "tipo" character varying(50), "fecha_inicio" date, "fecha_fin" date, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_evento" integer, CONSTRAINT "PK_9398be13474c44f07dabb4c6fe2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "inscripciones" ("id" SERIAL NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "nota_principal" double precision, "miembro_tyan" integer NOT NULL DEFAULT '0', "razon" text, "observacion" text, "estado" integer NOT NULL DEFAULT '1', "id_usuario" integer, "id_actividad_academica" integer, CONSTRAINT "PK_17a12f6ab342f6762d81e940d19" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "estado" integer NOT NULL DEFAULT '1', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "nombre_rol" character varying(50) NOT NULL, "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "usuarios_roles" ("id" SERIAL NOT NULL, "estado" integer NOT NULL DEFAULT '1', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_usuario" integer, "id_rol" integer, CONSTRAINT "PK_28de221731be7761ba1b165df08" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "personas" ADD CONSTRAINT "FK_8119d9635757d434ba622f004ba" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "afiliaciones" ADD CONSTRAINT "FK_ca47cc167e21ac4dcdd3213dc3c" FOREIGN KEY ("id_grado_academico") REFERENCES "grados_academicos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "afiliaciones" ADD CONSTRAINT "FK_e926c6dd9922ed725ecc4678ebd" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "coordinacion_eventos" ADD CONSTRAINT "FK_402ff63ff5650f8aac8a5d67b85" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "coordinacion_eventos" ADD CONSTRAINT "FK_4ce7acbd6de2b21720f6b816085" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usuarios_certificados" ADD CONSTRAINT "FK_33f4e720a49a7e52c18def89fdd" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usuarios_certificados" ADD CONSTRAINT "FK_1dd649ab2958be2093bc5c36784" FOREIGN KEY ("id_certificado") REFERENCES "certificados"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "certificados" ADD CONSTRAINT "FK_de56774610a130613f5c020b991" FOREIGN KEY ("id_info_certificado") REFERENCES "info_certificados"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "certificados" ADD CONSTRAINT "FK_92e39c703e2b2a70557279c036e" FOREIGN KEY ("id_actividad_academica") REFERENCES "actividades_academicas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "certificados" ADD CONSTRAINT "FK_1bb6179d0bd5feaff498118fa82" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "info_certificados" ADD CONSTRAINT "FK_35bcb71c445163ad90d394e2855" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "imparticiones" ADD CONSTRAINT "FK_eb807694ca272ad53b12f3c61b7" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "imparticiones" ADD CONSTRAINT "FK_64f05a3f76f588026d26d0b786e" FOREIGN KEY ("id_actividad_academica") REFERENCES "actividades_academicas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "imparticiones" ADD CONSTRAINT "FK_bd009dd23d411f925097556f902" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscripcion_modalidades" ADD CONSTRAINT "FK_e421278afb7e5a4cb0d29f264ff" FOREIGN KEY ("id_inscripcion") REFERENCES "inscripciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscripcion_modalidades" ADD CONSTRAINT "FK_4bba35d882698c648558162919d" FOREIGN KEY ("id_curso_modalidad") REFERENCES "curso_modalidades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asistencias" ADD CONSTRAINT "FK_9fc6076bcebdd2dd7a759bd414c" FOREIGN KEY ("id_inscripcion_modalidad") REFERENCES "inscripcion_modalidades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asistencias" ADD CONSTRAINT "FK_d0e7dcb2da46a2bc9edd48681e1" FOREIGN KEY ("id_sesion_academica") REFERENCES "sesiones_academicas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sesiones_academicas" ADD CONSTRAINT "FK_46576fd7c630ad40375f95b4448" FOREIGN KEY ("id_curso_modalidad") REFERENCES "curso_modalidades"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "curso_modalidades" ADD CONSTRAINT "FK_2c6730133591486741a2cc0ad86" FOREIGN KEY ("id_actividad_academica") REFERENCES "actividades_academicas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "actividades_academicas" ADD CONSTRAINT "FK_120cf911334d40fc3cd159d3807" FOREIGN KEY ("id_evento") REFERENCES "eventos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscripciones" ADD CONSTRAINT "FK_303f97e84e11e88de9c473628aa" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscripciones" ADD CONSTRAINT "FK_a9b6a1c2008f3cb8265d2fdd26e" FOREIGN KEY ("id_actividad_academica") REFERENCES "actividades_academicas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usuarios_roles" ADD CONSTRAINT "FK_fff4c9f548a476cc170128314dc" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usuarios_roles" ADD CONSTRAINT "FK_c658b8c0773fc6a78fcd295878d" FOREIGN KEY ("id_rol") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios_roles" DROP CONSTRAINT "FK_c658b8c0773fc6a78fcd295878d"`);
        await queryRunner.query(`ALTER TABLE "usuarios_roles" DROP CONSTRAINT "FK_fff4c9f548a476cc170128314dc"`);
        await queryRunner.query(`ALTER TABLE "inscripciones" DROP CONSTRAINT "FK_a9b6a1c2008f3cb8265d2fdd26e"`);
        await queryRunner.query(`ALTER TABLE "inscripciones" DROP CONSTRAINT "FK_303f97e84e11e88de9c473628aa"`);
        await queryRunner.query(`ALTER TABLE "actividades_academicas" DROP CONSTRAINT "FK_120cf911334d40fc3cd159d3807"`);
        await queryRunner.query(`ALTER TABLE "curso_modalidades" DROP CONSTRAINT "FK_2c6730133591486741a2cc0ad86"`);
        await queryRunner.query(`ALTER TABLE "sesiones_academicas" DROP CONSTRAINT "FK_46576fd7c630ad40375f95b4448"`);
        await queryRunner.query(`ALTER TABLE "asistencias" DROP CONSTRAINT "FK_d0e7dcb2da46a2bc9edd48681e1"`);
        await queryRunner.query(`ALTER TABLE "asistencias" DROP CONSTRAINT "FK_9fc6076bcebdd2dd7a759bd414c"`);
        await queryRunner.query(`ALTER TABLE "inscripcion_modalidades" DROP CONSTRAINT "FK_4bba35d882698c648558162919d"`);
        await queryRunner.query(`ALTER TABLE "inscripcion_modalidades" DROP CONSTRAINT "FK_e421278afb7e5a4cb0d29f264ff"`);
        await queryRunner.query(`ALTER TABLE "imparticiones" DROP CONSTRAINT "FK_bd009dd23d411f925097556f902"`);
        await queryRunner.query(`ALTER TABLE "imparticiones" DROP CONSTRAINT "FK_64f05a3f76f588026d26d0b786e"`);
        await queryRunner.query(`ALTER TABLE "imparticiones" DROP CONSTRAINT "FK_eb807694ca272ad53b12f3c61b7"`);
        await queryRunner.query(`ALTER TABLE "info_certificados" DROP CONSTRAINT "FK_35bcb71c445163ad90d394e2855"`);
        await queryRunner.query(`ALTER TABLE "certificados" DROP CONSTRAINT "FK_1bb6179d0bd5feaff498118fa82"`);
        await queryRunner.query(`ALTER TABLE "certificados" DROP CONSTRAINT "FK_92e39c703e2b2a70557279c036e"`);
        await queryRunner.query(`ALTER TABLE "certificados" DROP CONSTRAINT "FK_de56774610a130613f5c020b991"`);
        await queryRunner.query(`ALTER TABLE "usuarios_certificados" DROP CONSTRAINT "FK_1dd649ab2958be2093bc5c36784"`);
        await queryRunner.query(`ALTER TABLE "usuarios_certificados" DROP CONSTRAINT "FK_33f4e720a49a7e52c18def89fdd"`);
        await queryRunner.query(`ALTER TABLE "coordinacion_eventos" DROP CONSTRAINT "FK_4ce7acbd6de2b21720f6b816085"`);
        await queryRunner.query(`ALTER TABLE "coordinacion_eventos" DROP CONSTRAINT "FK_402ff63ff5650f8aac8a5d67b85"`);
        await queryRunner.query(`ALTER TABLE "afiliaciones" DROP CONSTRAINT "FK_e926c6dd9922ed725ecc4678ebd"`);
        await queryRunner.query(`ALTER TABLE "afiliaciones" DROP CONSTRAINT "FK_ca47cc167e21ac4dcdd3213dc3c"`);
        await queryRunner.query(`ALTER TABLE "personas" DROP CONSTRAINT "FK_8119d9635757d434ba622f004ba"`);
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
        await queryRunner.query(`DROP TABLE "grados_academicos"`);
        await queryRunner.query(`DROP TABLE "personas"`);
    }

}
