import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CoordinacionEvento } from '../../../Academico/coordinaciones/entities/coordinacion.entity';

@Entity('grados_administrativos')
export class GradoAdministrativo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 50, nullable: true })
  abreviatura: string;

  @OneToMany(() => CoordinacionEvento, (ce) => ce.gradoAdministrativo)
  coordinaciones: CoordinacionEvento[];
}
