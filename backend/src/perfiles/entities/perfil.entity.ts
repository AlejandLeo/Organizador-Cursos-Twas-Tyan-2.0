// Entidad obsoleta (PERFILES renombrado a PERSONAS en v2). No usar.
import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('perfiles_obsoletos')
export class Perfil {
  @PrimaryGeneratedColumn()
  id_perfil: number;
}
