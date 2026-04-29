import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Afiliacion } from '../../../Usuario/afiliaciones/entities/afiliacion.entity';

@Entity('grados_academicos')
export class GradoAcademico {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ length: 100 })
  descripcion: string;

  @Column({ length: 20, nullable: true })
  abreviacion: string;

  @OneToMany(() => Afiliacion, (afiliacion) => afiliacion.gradoAcademico)
  afiliaciones: Afiliacion[];

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
