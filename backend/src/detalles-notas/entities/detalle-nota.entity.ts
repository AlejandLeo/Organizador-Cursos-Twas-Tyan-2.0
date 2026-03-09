import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('detalles_notas')
export class DetalleNota {
  @PrimaryGeneratedColumn('uuid')
  id_detalle_nota: string;

  @Column('decimal')
  puntaje: number;

  @Column()
  descripcion: string;

  @Column()
  id_nota: string;

  @Column()
  id_detalle_actividad_academica: string;
}
