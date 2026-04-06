// Entidad obsoleta (NOTAS eliminada en v2, nota_principal vive en INSCRIPCIONES). No usar.
import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notas_obsoletas')
export class Nota {
  @PrimaryGeneratedColumn()
  id_nota: number;
}