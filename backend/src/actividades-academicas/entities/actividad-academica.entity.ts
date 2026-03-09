import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('actividades_academicas')
export class ActividadAcademica {
  @PrimaryGeneratedColumn('uuid')
  id_actividad_academica: string;

  @Column()
  nombre: string;

  @Column()
  tipo: string;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column()
  id_version_evento: string;
}
