import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioRol } from '../../usuarios-roles/entities/usuario-rol.entity';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn()
  id_rol: number;

  @Column({ length: 50 })
  nombre_rol: string;

  @OneToMany(() => UsuarioRol, (ur) => ur.rol)
  usuariosRoles: UsuarioRol[];
}
