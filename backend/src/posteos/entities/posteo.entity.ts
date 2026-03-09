import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('posteos')
export class Posteo {
  @PrimaryGeneratedColumn('uuid')
  id_posteo: string;

  @Column()
  titulo: string;

  @Column('text')
  contenido: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_registro: Date;

  @Column()
  estado: string;
}
