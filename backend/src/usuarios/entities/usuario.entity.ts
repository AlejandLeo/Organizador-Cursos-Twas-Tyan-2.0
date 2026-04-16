import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Persona } from '../../personas/entities/persona.entity';
import { UsuarioRol } from '../../usuarios-roles/entities/usuario-rol.entity';
import { Afiliacion } from '../../afiliaciones/entities/afiliacion.entity';
import { Inscripcion } from '../../inscripciones/entities/inscripcion.entity';
import { Certificado } from '../../certificados/entities/certificado.entity';
import { UsuarioCertificado } from '../../usuarios-certificados/entities/usuario-certificado.entity';
import { CoordinacionEvento } from '../../coordinaciones/entities/coordinacion.entity';
import { Imparticion } from '../../imparticiones/entities/imparticion.entity';

/**
 * USUARIOS — credenciales de acceso al sistema.
 *
 * Esta tabla SOLO guarda email + password (hasheado).
 * Los datos personales van en PERSONAS.
 * Los datos institucionales van en AFILIACIONES.
 *
 * estado: 1 = Activo, 0 = Inactivo (se puede desactivar sin borrar).
 */
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ unique: true, length: 255 })
  email: string;

  /** SIEMPRE hasheado con bcrypt antes de guardar. Nunca texto plano. */
  @Column({ length: 255 })
  password: string;

  /** 1 = Activo | 0 = Inactivo */
  @Column({ type: 'integer', default: 1 })
  estado: number;

  // ── Relaciones ────────────────────────────────────────────────────────────

  /**
   * Relación 1-a-1 con PERSONAS.
   * El @JoinColumn vive en PERSONAS (allá está la FK id_usuario UNIQUE).
   */
  @OneToOne(() => Persona, (persona) => persona.usuario)
  persona: Persona;

  /** Un usuario puede tener múltiples roles. */
  @OneToMany(() => UsuarioRol, (ur) => ur.usuario)
  usuariosRoles: UsuarioRol[];

  /** Un usuario puede tener múltiples afiliaciones institucionales. */
  @OneToMany(() => Afiliacion, (af) => af.usuario)
  afiliaciones: Afiliacion[];

  /** Cursos/talleres en los que está inscrito. */
  @OneToMany(() => Inscripcion, (ins) => ins.usuario)
  inscripciones: Inscripcion[];

  /** Certificados emitidos directamente a nombre de este usuario. */
  @OneToMany(() => Certificado, (cert) => cert.usuario)
  certificados: Certificado[];

  /** Relaciones extendidas usuario-certificado (firmante, coordinador, etc.) */
  @OneToMany(() => UsuarioCertificado, (uc) => uc.usuario)
  usuariosCertificados: UsuarioCertificado[];

  /** Eventos que coordina. */
  @OneToMany(() => CoordinacionEvento, (ce) => ce.usuario)
  coordinaciones: CoordinacionEvento[];

  /** Actividades que imparte. */
  @OneToMany(() => Imparticion, (imp) => imp.usuario)
  imparticiones: Imparticion[];

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
