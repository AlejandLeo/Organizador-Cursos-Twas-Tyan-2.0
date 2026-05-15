import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * AUDIT_LOGS — Bitácora de auditoría del sistema.
 *
 * Registra cada acción relevante: creación, edición y eliminación
 * de eventos, actividades, usuarios y certificados.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  /** Módulo afectado: evento, actividad, usuario, certificado */
  @Column({ length: 50 })
  modulo: string;

  /** Tipo de acción: crear, editar, eliminar */
  @Column({ length: 50 })
  accion: string;

  /** Descripción legible de la acción */
  @Column({ type: 'text' })
  descripcion: string;

  /** Nombre/email del usuario que realizó la acción */
  @Column({ length: 255 })
  usuario: string;

  /** ID de la entidad afectada (evento, actividad, etc.) */
  @Column({ length: 100, nullable: true })
  entidad_id: string;

  /** Nombre de la entidad afectada */
  @Column({ length: 255, nullable: true })
  entidad_nombre: string;

  /** Detalle de cambios en formato JSON: [{campo, antes, despues}] */
  @Column({ type: 'jsonb', nullable: true })
  cambios: any;

  /** Metadatos adicionales en formato JSON */
  @Column({ type: 'jsonb', nullable: true })
  metadatos: any;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha_creacion: Date;
}
