import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('inscripciones')
export class Inscripcion {
  @PrimaryGeneratedColumn('uuid')
  id_inscripcion: string;

  @Column()
  estado: string;

  @Column({ type: 'date' })
  fecha_registro: Date;

  @Column()
  id_usuario: string;

  @Column()
  id_detalle_actividad_academica: string;
}
