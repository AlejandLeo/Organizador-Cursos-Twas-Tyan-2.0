import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id_rol: string;

  @Column()
  nombre_rol: string;
}
