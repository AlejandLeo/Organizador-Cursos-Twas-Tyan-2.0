import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Rol } from '../../roles/entities/rol.entity';


@Entity('usuarios_roles')
export class UsuarioRol {
  @PrimaryGeneratedColumn()
  id_usuario_rol: number;

  @Column({ type: 'integer', default: 1 })
  estado: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuariosRoles)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Rol, (rol) => rol.usuariosRoles)
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;
}
