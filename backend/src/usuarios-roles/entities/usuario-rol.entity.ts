import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuarios_roles')
export class UsuarioRol {
  @PrimaryGeneratedColumn('uuid')
  id_usuario_rol: string;

  @Column()
  estado: string;

  @Column()
  id_usuario: string;

  @Column()
  id_rol: string;
}
