import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('detalles_actividades_academicas')
export class DetalleActividadAcademica {
  @PrimaryGeneratedColumn('uuid')
  id_detalle_actividad_academica: string;

  @Column()
  tipo: string;

  @Column()
  min_nota: string;

  @Column()
  min_asistencia: string;

  @Column()
  id_actividad_academica: string;
}
