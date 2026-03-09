import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('versiones_eventos')
export class VersionEvento {
  @PrimaryGeneratedColumn('uuid')
  id_version_evento: string;

  @Column()
  descripcion: string;

  @Column()
  gestion: string;

  @Column()
  ubicacion: string;

  @Column()
  direccion: string;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column()
  estado: string;

  @Column()
  id_evento: string;
}
