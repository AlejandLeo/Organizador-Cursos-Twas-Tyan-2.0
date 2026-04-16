import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Usuario } from '../../usuarios/entities/usuario.entity';
import { Certificado } from '../../certificados/entities/certificado.entity';

/**
 * USUARIOS_CERTIFICADOS — tabla de relación entre usuarios y certificados.
 *
 * ¿Por qué existe si CERTIFICADOS ya tiene id_usuario?
 * Porque un certificado puede involucrar a MÚLTIPLES usuarios con
 * diferentes roles:
 *   - El estudiante (beneficiario principal)
 *   - El coordinador que lo firma
 *   - El docente que lo avala
 *
 * tipo_relacion: describe el rol del usuario en este certificado.
 * es_beneficiario: marca quién es el receptor principal.
 */
@Entity('usuarios_certificados')
export class UsuarioCertificado {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /**
   * Ej: 'Beneficiario', 'Firmante', 'Coordinador', 'Docente'
   * Permite filtrar después: "dame todos los certificados donde yo soy firmante"
   */
  @Column({ length: 50, nullable: true })
  tipo_relacion: string;

  /**
   * 1 = Este usuario es el receptor principal del certificado.
   * 0 = Es un participante secundario (firmante, aval, etc.)
   */
  @Column({ type: 'integer', default: 0 })
  es_beneficiario: number;

  // ── Relaciones ────────────────────────────────────────────────────────────

  @ManyToOne(() => Usuario, (usuario) => usuario.usuariosCertificados)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @ManyToOne(() => Certificado, (cert) => cert.usuariosCertificados)
  @JoinColumn({ name: 'id_certificado' })
  certificado: Certificado;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
