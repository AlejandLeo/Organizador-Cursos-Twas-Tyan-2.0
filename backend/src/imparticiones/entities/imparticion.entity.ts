import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('imparticiones')
export class Imparticion {
  @PrimaryGeneratedColumn('uuid')
  id_imparticion: string;

  @Column()
  id_usuario: string;

  @Column()
  id_detalle_actividad_academica: string;
}
