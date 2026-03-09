import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pre_inscripciones')
export class PreInscripcion {
  @PrimaryGeneratedColumn('uuid')
  id_pre_inscripcion: string;

  @Column()
  actividad_academica: string;

  @Column({ type: 'date' })
  fecha_registro: Date;

  @Column()
  miembro_tyan: string;

  @Column()
  razon: string;

  @Column()
  estado: string;

  @Column()
  id_version_evento: string;

  @Column()
  id_usuario: string;
}
