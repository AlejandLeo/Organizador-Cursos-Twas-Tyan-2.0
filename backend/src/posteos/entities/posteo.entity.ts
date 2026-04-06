// Entidad obsoleta (POSTEOS eliminada en v2). No usar.
import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('posteos_obsoletos')
export class Posteo {
  @PrimaryGeneratedColumn()
  id_posteo: number;
}
