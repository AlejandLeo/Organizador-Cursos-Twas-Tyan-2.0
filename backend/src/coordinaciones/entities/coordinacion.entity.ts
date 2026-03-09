import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('coordinaciones')
export class Coordinacion {
  @PrimaryGeneratedColumn('uuid')
  id_coordinacion: string;

  @Column()
  id_usuario: string;

  @Column()
  id_version_evento: string;
}
