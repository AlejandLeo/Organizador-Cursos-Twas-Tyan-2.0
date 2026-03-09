import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('asistencias')
export class Asistencia {
  @PrimaryGeneratedColumn('uuid')
  id_asistencia: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_hora_registro: Date;

  @Column()
  estado: string;

  @Column()
  id_inscripcion: string;

  @Column()
  id_sesion_academica: string;
}
