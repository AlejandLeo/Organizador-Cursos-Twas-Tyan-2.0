import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sesiones_academicas')
export class SesionAcademica {
  @PrimaryGeneratedColumn('uuid')
  id_sesion_academica: string;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'time' })
  hora_inicio: string;

  @Column({ type: 'time' })
  hora_fin: string;

  @Column()
  modalidad: string;

  @Column()
  aula: string;

  @Column()
  cod_verificacion: string;

  @Column()
  id_detalle_actividad_academica: string;
}
