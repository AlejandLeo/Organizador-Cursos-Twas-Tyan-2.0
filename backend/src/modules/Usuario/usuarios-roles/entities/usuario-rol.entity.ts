import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../../Usuario/usuarios/entities/usuario.entity';
import { Rol } from '../../../Usuario/roles/entities/rol.entity';

/**
 * USUARIOS_ROLES — tabla pivote que relaciona un usuario con uno o más roles.
 *
 * Un usuario puede tener varios roles simultáneamente (ej: Ponente + Coordinador).
 * estado: 1 = activo (el rol está vigente), 0 = revocado.
 */
@Entity('usuarios_roles')
export class UsuarioRol {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** 1 = Activo | 0 = Revocado */
  @Column({ type: 'integer', default: 1 })
  estado: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.usuariosRoles)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  /** Faltaba el @ManyToOne — sin él TypeORM no genera el JOIN correctamente. */
  @ManyToOne(() => Rol, (rol) => rol.usuariosRoles)
  @JoinColumn({ name: 'id_rol' })
  rol: Rol;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
