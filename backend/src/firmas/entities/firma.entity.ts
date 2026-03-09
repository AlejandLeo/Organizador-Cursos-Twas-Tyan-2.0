import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('firmas')
export class Firma {
  @PrimaryGeneratedColumn('uuid')
  id_firma: string;

  @Column()
  url_firma: string;

  @Column()
  id_usuario: string;
}
