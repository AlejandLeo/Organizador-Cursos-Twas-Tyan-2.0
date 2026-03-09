import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuarios')
export class Usuario {

  @PrimaryGeneratedColumn('uuid')
  id_usuario: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  estado: string;

  @Column({ nullable: true })
  id_certificado: string;

}