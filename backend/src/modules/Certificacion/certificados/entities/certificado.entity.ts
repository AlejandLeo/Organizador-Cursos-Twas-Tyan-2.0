import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { InfoCertificado } from '../../../Certificacion/info-certificados/entities/info-certificado.entity';
import { ActividadAcademica } from '../../../Academico/actividades-academicas/entities/actividad-academica.entity';
import { Usuario } from '../../../Usuario/usuarios/entities/usuario.entity';
import { UsuarioCertificado } from '../../../Certificacion/usuarios-certificados/entities/usuario-certificado.entity';

/**
 * CERTIFICADOS — certificado emitido a un usuario por completar una actividad.
 *
 * Cambio v2: tres campos de seguridad reemplazando el anterior codigo_verificacion único:
 *
 *   codigo_certificado → Código visible en el QR impreso en el certificado.
 *                         Cualquier persona puede escanearlo para verificar autenticidad.
 *
 *   uuid_archivo       → UUID interno que NestJS usa para localizar el archivo PDF
 *                         en la carpeta protegida del servidor. NUNCA se expone al público.
 *
 *   hash_integridad    → HMAC-SHA256 calculado sobre el contenido del PDF.
 *                         Al verificar, NestJS recalcula el HMAC y lo compara.
 *                         Si son distintos, el archivo fue alterado.
 *
 * tipo: 1 = Asistente | 2 = Expositor | 3 = Organizador | 4 = Docente
 */
@Entity('certificados')
export class Certificado {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** Código público del QR. Único por certificado. */
  @Column({ unique: true, length: 255 })
  codigo_certificado: string;

  /** UUID interno para localizar el PDF en el servidor. No se expone en la API pública. */
  @Column({ unique: true, length: 255 })
  uuid_archivo: string;

  /**
   * Hash HMAC-SHA256 del archivo PDF.
   * Se genera con: HMAC(contenido_pdf, SECRET_KEY + salt).
   * Al verificar integridad, se recalcula y se compara.
   */
  @Column({ length: 255, nullable: true })
  hash_integridad: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  fecha_emision: Date;

  /** 1: Asistente | 2: Expositor | 3: Organizador | 4: Docente */
  @Column({ type: 'integer', nullable: true })
  tipo: number;

  /** 1 = Válido | 0 = Revocado */
  @Column({ type: 'integer', default: 1 })
  estado: number;

  /** Trazabilidad de envío: pendiente | enviado | error */
  @Column({ length: 50, default: 'pendiente' })
  estado_envio: string;

  /** Fecha del último intento de envío por correo */
  @Column({ type: 'timestamptz', nullable: true })
  fecha_ultimo_envio: Date;

  /** Registro de errores técnicos en caso de fallo de envío */
  @Column({ type: 'text', nullable: true })
  log_error_envio: string | null;

  /** Contador de intentos de envío */
  @Column({ type: 'integer', default: 0 })
  reintentos: number;

  // ── Relaciones ────────────────────────────────────────────────────────────

  /** La plantilla de texto utilizada para generar este certificado. */
  @ManyToOne(() => InfoCertificado, (info) => info.certificados)
  @JoinColumn({ name: 'id_info_certificado' })
  infoCertificado: InfoCertificado;

  /** La actividad por la que se emitió. */
  @ManyToOne(() => ActividadAcademica, (act) => act.certificados)
  @JoinColumn({ name: 'id_actividad_academica' })
  actividadAcademica: ActividadAcademica;

  /** El usuario principal (beneficiario) del certificado. */
  @ManyToOne(() => Usuario, (usuario) => usuario.certificados)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @OneToMany(() => UsuarioCertificado, (uc) => uc.certificado)
  usuariosCertificados: UsuarioCertificado[];

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  fecha_actualizacion: Date;
}
