import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('eventos')
export class Evento {
  @PrimaryGeneratedColumn('uuid')
  id_evento: string;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @Column()
  gestion: string;

  @Column({ nullable: true })
  logo: string;
}
