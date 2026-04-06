// Entidad obsoleta (FIRMAS eliminada en v2, firma_dig vive en PERSONAS). No usar.
import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('firmas_obsoletas')
export class Firma {
  @PrimaryGeneratedColumn()
  id_firma: number;
}
