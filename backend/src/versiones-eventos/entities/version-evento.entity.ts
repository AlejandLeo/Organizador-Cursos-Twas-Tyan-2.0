// Entidad obsoleta (VERSIONES_EVENTOS eliminada en v2).
// Se deja vacía para no perder la carpeta. No usar.
import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('versiones_eventos_obsoleta')
export class VersionEvento {
  @PrimaryGeneratedColumn()
  id_version_evento: number;
}
